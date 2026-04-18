import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db.js';

import Machine from '../models/Machine.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import DemandForecast from '../models/DemandForecast.js';
import ProductionOrder from '../models/ProductionOrder.js';
import ScheduleSlot from '../models/ScheduleSlot.js';

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🌱  Starting database seed…\n');

    console.log('🗑️   Clearing existing data…');
    await Promise.all([
      Machine.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
      DemandForecast.deleteMany({}),
      ProductionOrder.deleteMany({}),
      ScheduleSlot.deleteMany({}),
    ]);
    console.log('     ✓ All collections cleared\n');

    console.log('🔧  Seeding machines...');
    const machineDocs = [
      { name: 'Cutting Machine A', type: 'Cutting', shiftMinutes: 480, isOperational: true, location: 'Bay 1' },
      { name: 'Sewing Machine B', type: 'Sewing', shiftMinutes: 480, isOperational: true, location: 'Bay 2' },
      { name: 'Finishing Unit C', type: 'Other', shiftMinutes: 480, isOperational: true, location: 'Bay 3' },
      { name: 'Pressing Machine D', type: 'Pressing', shiftMinutes: 480, isOperational: false, location: 'Bay 4' }
    ];
    const machines = await Machine.insertMany(machineDocs);
    const mCutting = machines.find(m => m.name === 'Cutting Machine A');
    const mSewing = machines.find(m => m.name === 'Sewing Machine B');
    const mFinishing = machines.find(m => m.name === 'Finishing Unit C');
    const mPressing = machines.find(m => m.name === 'Pressing Machine D');

    console.log('📦  Seeding products...');
    const productDocs = [
      {
        name: 'Classic T-Shirt', category: 'Apparel', isActive: true,
        sizes: [
          { sizeLabel: 'S', sku: 'TSHIRT-S', machineMinutesPerUnit: 10, materialQtyPerUnit: 1.0 },
          { sizeLabel: 'M', sku: 'TSHIRT-M', machineMinutesPerUnit: 11, materialQtyPerUnit: 1.1 },
          { sizeLabel: 'L', sku: 'TSHIRT-L', machineMinutesPerUnit: 12, materialQtyPerUnit: 1.2 },
          { sizeLabel: 'XL', sku: 'TSHIRT-XL', machineMinutesPerUnit: 13, materialQtyPerUnit: 1.3 }
        ]
      },
      {
        name: 'Denim Jeans', category: 'Bottoms', isActive: true,
        sizes: [
          { sizeLabel: '28', sku: 'JEANS-28', machineMinutesPerUnit: 25, materialQtyPerUnit: 2.0 },
          { sizeLabel: '30', sku: 'JEANS-30', machineMinutesPerUnit: 26, materialQtyPerUnit: 2.1 },
          { sizeLabel: '32', sku: 'JEANS-32', machineMinutesPerUnit: 27, materialQtyPerUnit: 2.2 },
          { sizeLabel: '34', sku: 'JEANS-34', machineMinutesPerUnit: 28, materialQtyPerUnit: 2.3 }
        ]
      },
      {
        name: 'Winter Jacket', category: 'Outerwear', isActive: true,
        sizes: [
          { sizeLabel: 'S', sku: 'JACKET-S', machineMinutesPerUnit: 45, materialQtyPerUnit: 3.0 },
          { sizeLabel: 'M', sku: 'JACKET-M', machineMinutesPerUnit: 48, materialQtyPerUnit: 3.2 },
          { sizeLabel: 'L', sku: 'JACKET-L', machineMinutesPerUnit: 50, materialQtyPerUnit: 3.4 },
          { sizeLabel: 'XL', sku: 'JACKET-XL', machineMinutesPerUnit: 52, materialQtyPerUnit: 3.6 }
        ]
      },
      {
        name: 'Sports Shorts', category: 'Activewear', isActive: true,
        sizes: [
          { sizeLabel: 'S', sku: 'SHORTS-S', machineMinutesPerUnit: 15, materialQtyPerUnit: 0.8 },
          { sizeLabel: 'M', sku: 'SHORTS-M', machineMinutesPerUnit: 16, materialQtyPerUnit: 0.9 },
          { sizeLabel: 'L', sku: 'SHORTS-L', machineMinutesPerUnit: 17, materialQtyPerUnit: 1.0 }
        ]
      },
      {
        name: 'Formal Shirt', category: 'Formal', isActive: true,
        sizes: [
          { sizeLabel: 'S', sku: 'FSHIRT-S', machineMinutesPerUnit: 20, materialQtyPerUnit: 1.5 },
          { sizeLabel: 'M', sku: 'FSHIRT-M', machineMinutesPerUnit: 21, materialQtyPerUnit: 1.6 },
          { sizeLabel: 'L', sku: 'FSHIRT-L', machineMinutesPerUnit: 22, materialQtyPerUnit: 1.7 },
          { sizeLabel: 'XL', sku: 'FSHIRT-XL', machineMinutesPerUnit: 23, materialQtyPerUnit: 1.8 }
        ]
      }
    ];

    const products = await Product.insertMany(productDocs);
    const pTshirt = products.find(p => p.name === 'Classic T-Shirt');
    const pJeans = products.find(p => p.name === 'Denim Jeans');
    const pJacket = products.find(p => p.name === 'Winter Jacket');
    const pShorts = products.find(p => p.name === 'Sports Shorts');
    const pFshirt = products.find(p => p.name === 'Formal Shirt');

    console.log('🏭  Seeding inventory...');
    const invData = [
      { sku: 'TSHIRT-S', qty: 85, point: 50 }, { sku: 'TSHIRT-M', qty: 120, point: 50 }, { sku: 'TSHIRT-L', qty: 30, point: 50 }, { sku: 'TSHIRT-XL', qty: 10, point: 50 },
      { sku: 'JEANS-28', qty: 60, point: 40 }, { sku: 'JEANS-30', qty: 45, point: 40 }, { sku: 'JEANS-32', qty: 15, point: 40 }, { sku: 'JEANS-34', qty: 70, point: 40 },
      { sku: 'JACKET-S', qty: 5, point: 30 }, { sku: 'JACKET-M', qty: 8, point: 30 }, { sku: 'JACKET-L', qty: 55, point: 30 }, { sku: 'JACKET-XL', qty: 40, point: 30 },
      { sku: 'SHORTS-S', qty: 90, point: 35 }, { sku: 'SHORTS-M', qty: 75, point: 35 }, { sku: 'SHORTS-L', qty: 20, point: 35 },
      { sku: 'FSHIRT-S', qty: 50, point: 45 }, { sku: 'FSHIRT-M', qty: 100, point: 45 }, { sku: 'FSHIRT-L', qty: 38, point: 45 }, { sku: 'FSHIRT-XL', qty: 65, point: 45 }
    ];

    const inventoryDocs = [];
    products.forEach(p => {
      p.sizes.forEach(size => {
        const d = invData.find(x => x.sku === size.sku);
        if (d) {
          inventoryDocs.push({
            productId: p._id,
            sizeId: size._id,
            sku: size.sku,
            quantityOnHand: d.qty,
            reorderPoint: d.point
          });
        }
      });
    });
    await Inventory.insertMany(inventoryDocs);

    console.log('🗂️   Seeding production orders...');
    const now = new Date();
    
    const poDocs = [
      {
        orderNumber: 'PO-00001',
        productId: pTshirt._id,
        status: 'completed',
        dueDate: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)),
        items: [
          { sizeId: pTshirt.sizes.find(s=>s.sizeLabel==='L')._id, sku: 'TSHIRT-L', sizeLabel: 'L', plannedQty: 80, machineMinutesPerUnit: 12 },
          { sizeId: pTshirt.sizes.find(s=>s.sizeLabel==='XL')._id, sku: 'TSHIRT-XL', sizeLabel: 'XL', plannedQty: 60, machineMinutesPerUnit: 13 }
        ],
        notes: 'Classic T-Shirt PO'
      },
      {
        orderNumber: 'PO-00002',
        productId: pJeans._id,
        status: 'in-progress',
        dueDate: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)),
        items: [
          { sizeId: pJeans.sizes.find(s=>s.sizeLabel==='32')._id, sku: 'JEANS-32', sizeLabel: '32', plannedQty: 50, machineMinutesPerUnit: 27 }
        ],
        notes: 'Denim Jeans PO'
      },
      {
        orderNumber: 'PO-00003',
        productId: pJacket._id,
        status: 'pending',
        dueDate: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)),
        items: [
          { sizeId: pJacket.sizes.find(s=>s.sizeLabel==='S')._id, sku: 'JACKET-S', sizeLabel: 'S', plannedQty: 40, machineMinutesPerUnit: 45 },
          { sizeId: pJacket.sizes.find(s=>s.sizeLabel==='M')._id, sku: 'JACKET-M', sizeLabel: 'M', plannedQty: 35, machineMinutesPerUnit: 48 }
        ],
        notes: 'Winter Jacket PO'
      },
      {
        orderNumber: 'PO-00004',
        productId: pShorts._id,
        status: 'pending',
        dueDate: new Date(now.getTime() + (12 * 24 * 60 * 60 * 1000)),
        items: [
          { sizeId: pShorts.sizes.find(s=>s.sizeLabel==='L')._id, sku: 'SHORTS-L', sizeLabel: 'L', plannedQty: 30, machineMinutesPerUnit: 17 }
        ],
        notes: 'Sports Shorts PO'
      },
      {
        orderNumber: 'PO-00005',
        productId: pFshirt._id,
        status: 'in-progress',
        dueDate: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)),
        items: [
          { sizeId: pFshirt.sizes.find(s=>s.sizeLabel==='L')._id, sku: 'FSHIRT-L', sizeLabel: 'L', plannedQty: 25, machineMinutesPerUnit: 22 }
        ],
        notes: 'Formal Shirt PO'
      }
    ];
    const pos = await ProductionOrder.insertMany(poDocs);

    console.log('🗓️   Seeding schedule slots...');
    const todayAt = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };

    const po1 = pos.find(o => o.orderNumber === 'PO-00001');
    const po2 = pos.find(o => o.orderNumber === 'PO-00002');
    const po3 = pos.find(o => o.orderNumber === 'PO-00003');
    const po4 = pos.find(o => o.orderNumber === 'PO-00004');

    const slotsData = [
      {
        productionOrderId: po1._id, orderNumber: po1.orderNumber,
        machineId: mCutting._id, machineName: mCutting.name,
        startTime: todayAt(6, 0), endTime: todayAt(10, 0),
        durationMinutes: 240, status: 'completed'
      },
      {
        productionOrderId: po3._id, orderNumber: po3.orderNumber,
        machineId: mCutting._id, machineName: mCutting.name,
        startTime: todayAt(10, 15), endTime: todayAt(14, 0),
        durationMinutes: 225, status: 'scheduled'
      },
      {
        productionOrderId: po2._id, orderNumber: po2.orderNumber,
        machineId: mSewing._id, machineName: mSewing.name,
        startTime: todayAt(6, 0), endTime: todayAt(9, 0),
        durationMinutes: 180, status: 'scheduled'
      },
      {
        productionOrderId: po4._id, orderNumber: po4.orderNumber,
        machineId: mFinishing._id, machineName: mFinishing.name,
        startTime: todayAt(6, 0), endTime: todayAt(7, 30),
        durationMinutes: 90, status: 'scheduled'
      }
    ];
    await ScheduleSlot.insertMany(slotsData);

    console.log('📈  Seeding demand forecasts...');
    const forecastSetup = [
      { sku: 'TSHIRT-L', qty: 95 },
      { sku: 'TSHIRT-XL', qty: 72 },
      { sku: 'JEANS-32', qty: 68 },
      { sku: 'JACKET-S', qty: 50 },
      { sku: 'JACKET-M', qty: 45 },
      { sku: 'SHORTS-L', qty: 38 },
      { sku: 'FSHIRT-L', qty: 30 }
    ];
    
    const forecastDocs = forecastSetup.map(f => {
      let fprod = products.find(p => p.sizes.some(s => s.sku === f.sku));
      let fsize = fprod.sizes.find(s => s.sku === f.sku);
      return {
        productId: fprod._id, sizeId: fsize._id, sku: f.sku,
        forecastPeriod: '2025-07', forecastQty: f.qty,
        method: 'manual', confidencePct: 80
      };
    });
    await DemandForecast.insertMany(forecastDocs);

    console.log('\n' + '─'.repeat(50));
    console.log('✅  Seed complete! Your database is ready.\n');
    console.log('─'.repeat(50) + '\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seed();
