import mongoose from 'mongoose';
import DemandForecast from '../models/DemandForecast.js';
import Inventory from '../models/Inventory.js';
import ProductionOrder from '../models/ProductionOrder.js';
import Product from '../models/Product.js';

const DUE_DATE_DAYS = 30;

const daysFromNow = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const generateProductionOrders = async (forecastPeriod) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(forecastPeriod)) {
    throw new Error(`Invalid forecastPeriod "${forecastPeriod}". Expected YYYY-MM`);
  }

  const forecasts = await DemandForecast.find({ forecastPeriod })
    .select('productId sizeId sku forecastQty')
    .lean();

  if (forecasts.length === 0) {
    console.warn(`[planningEngine] No forecasts found for period ${forecastPeriod}`);
    return [];
  }

  const forecastedSkus = forecasts.map((f) => f.sku);
  const inventoryRecords = await Inventory.find({ sku: { $in: forecastedSkus } })
    .select('sku quantityOnHand sizeId productId')
    .lean();

  const invMap = {};
  for (const inv of inventoryRecords) {
    invMap[inv.sku] = inv.quantityOnHand;
  }

  const productGroups = {};

  for (const forecast of forecasts) {
    const { productId, sizeId, sku, forecastQty } = forecast;
    const quantityOnHand  = invMap[sku] ?? 0;
    const netRequirement  = forecastQty - quantityOnHand;

    if (netRequirement <= 0) {
      console.log(`[planningEngine] SKU ${sku}: stock sufficient. Skipping.`);
      continue;
    }

    const key = productId ? productId.toString() : 'UNKNOWN';
    if (!productGroups[key]) productGroups[key] = [];

    productGroups[key].push({ productId, sizeId, sku, netRequirement });
  }

  const productIds = Object.keys(productGroups);
  if (productIds.length === 0) {
    console.log('[planningEngine] All inventory levels sufficient. No orders needed.');
    return [];
  }

  const objectIds = productIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const products = await Product.find({ _id: { $in: objectIds } })
    .select('name sizes')
    .lean();

  const productSizeMap = {};
  for (const product of products) {
    const sizeDetails = {};
    for (const size of (product.sizes || [])) {
      sizeDetails[size._id.toString()] = {
        sizeLabel:            size.sizeLabel,
        machineMinutesPerUnit: size.machineMinutesPerUnit,
      };
    }
    productSizeMap[product._id.toString()] = {
      name:    product.name,
      sizes:   sizeDetails,
    };
  }

  const dueDate   = daysFromNow(DUE_DATE_DAYS);
  const newOrders = [];

  let poCount = await ProductionOrder.countDocuments();

  for (const productIdStr of productIds) {
    const items    = productGroups[productIdStr];
    const prodInfo = productSizeMap[productIdStr] || {};

    const orderItems = [];

    for (const item of items) {
      const sizeIdStr  = item.sizeId ? item.sizeId.toString() : null;
      const sizeInfo   = sizeIdStr && prodInfo.sizes ? prodInfo.sizes[sizeIdStr] : null;

      orderItems.push({
        sizeId:               item.sizeId,
        sku:                  item.sku,
        sizeLabel:            sizeInfo ? sizeInfo.sizeLabel           : 'N/A',
        plannedQty:           item.netRequirement,
        machineMinutesPerUnit: sizeInfo ? sizeInfo.machineMinutesPerUnit : 0,
      });
    }

    poCount++;
    const orderNumber = `PO-${String(poCount).padStart(5, '0')}`;

    newOrders.push({
      orderNumber,
      productId: items[0].productId,
      status:    'pending',
      dueDate,
      items:     orderItems,
      notes:     `Auto-generated for forecast period ${forecastPeriod}`,
    });
  }

  const created = await ProductionOrder.insertMany(newOrders, { ordered: false });

  console.log(`[planningEngine] Created ${created.length} production order(s) for period ${forecastPeriod}`);

  return created.map((o) => o.toObject());
};
