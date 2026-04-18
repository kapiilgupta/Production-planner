# ⚙️ Production Planner

> **Automatic Production Planning & Scheduling System**  
> Built with Node.js · Express · MongoDB · EJS

An end-to-end production management system that automatically generates demand forecasts, creates production orders based on inventory shortfalls, and schedules them across machines using the **Earliest Due Date (EDD)** algorithm.

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Algorithm Explanations](#algorithm-explanations)
- [Step-by-Step Testing Guide](#step-by-step-testing-guide)

---

## ✨ Features

| Module | What it Does |
|--------|-------------|
| **Products** | Define garment products with multiple size variants (S/M/L/XL), each with its own SKU and machine time |
| **Inventory** | Track real-time stock levels; automatic low-stock alerts when quantity drops below reorder point |
| **Demand Forecast** | 3-period Moving Average algorithm predicts next month's demand per SKU |
| **Production Orders** | Auto-generates orders for every SKU with a net stock shortfall; groups all sizes of one product into a single PO |
| **Scheduling** | Earliest Due Date (EDD) algorithm assigns POs to the least-loaded operational machine |
| **Machines** | Configure machines with shift capacity; real-time utilisation % dashboard |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB 6 + Mongoose 8 |
| Templating | EJS (server-rendered shell, data loaded via `fetch()`) |
| Styling | Vanilla CSS (dark-navy + blue, glassmorphism, responsive) |
| Dev Tools | nodemon, dotenv, morgan, cors |

---

## 📁 Project Structure

```
production-planner/
├── src/
│   ├── config/
│   │   ├── db.js               MongoDB connection
│   │   └── seed.js             Demo data seeder
│   ├── middleware/
│   │   └── errorHandler.js     Global JSON error handler
│   ├── models/
│   │   ├── Product.js          Product + embedded sizes[]
│   │   ├── Inventory.js        Stock levels per SKU
│   │   ├── DemandForecast.js   Monthly forecasts
│   │   ├── ProductionOrder.js  PO with items[]
│   │   ├── Machine.js          Machine capacity
│   │   └── ScheduleSlot.js     Time-blocked schedule entries
│   ├── services/
│   │   ├── forecastService.js  Moving Average algorithm
│   │   ├── planningEngine.js   Net-requirement planning
│   │   └── schedulingEngine.js EDD scheduling
│   ├── controllers/            5 controller files (thin layer)
│   ├── routes/                 5 Express router files
│   ├── views/                  EJS templates
│   │   ├── layout/             header.ejs · footer.ejs
│   │   ├── dashboard.ejs
│   │   ├── products/index.ejs
│   │   ├── inventory/index.ejs
│   │   ├── forecast/index.ejs
│   │   ├── planning/index.ejs
│   │   ├── schedule/index.ejs
│   │   └── machines/index.ejs
│   └── app.js                  Express entry point
├── public/
│   └── css/style.css
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18 or later ([download](https://nodejs.org))
- **MongoDB** v6 or later — local install or free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1. Clone / navigate to the project
```bash
cd production-planner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env   # or create .env manually
```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/production-planner
PORT=3000
NODE_ENV=development
```

### 4. Seed the database
```bash
node src/config/seed.js
```

Expected output:
```
🌱  Starting database seed…
🔧  Seeded 2 machines: Cutting Machine A, Sewing Machine B
📦  Seeded product: "Classic T-Shirt" (S/M/L/XL)
🏭  Seeded 4 inventory records (qty=30, reorderPoint=50 → all LOW STOCK)
📈  Seeded 16 demand forecast records
🗂️   Seeded production order: PO-00001
✅  Seed complete!
```

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `PORT` | ❌ | `3000` | HTTP port |
| `NODE_ENV` | ❌ | `development` | `development` (shows stack traces) or `production` |
| `LOG_LEVEL` | ❌ | `dev` | Morgan log format (`dev`, `combined`, `tiny`) |
| `APP_NAME` | ❌ | `Production Planner` | Display name in sidebar |

---

## 🚀 Running the App

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start

# Seed / reset database
npm run seed
```

Open **http://localhost:3000**

---

## 📡 API Endpoints

### Products — `/api/products`

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/products` | List all active products |
| `POST` | `/api/products` | Create product + auto-init Inventory per size |
| `GET` | `/api/products/:id` | Get product by ID |
| `PATCH` | `/api/products/:id` | Update name/category/isActive |

**Create Product body:**
```json
{
  "name": "Classic T-Shirt",
  "category": "Tops",
  "sizes": [
    { "sizeLabel": "S",  "sku": "TSHIRT-S",  "machineMinutesPerUnit": 8,  "materialQtyPerUnit": 1.0 },
    { "sizeLabel": "M",  "sku": "TSHIRT-M",  "machineMinutesPerUnit": 9,  "materialQtyPerUnit": 1.1 },
    { "sizeLabel": "L",  "sku": "TSHIRT-L",  "machineMinutesPerUnit": 10, "materialQtyPerUnit": 1.2 },
    { "sizeLabel": "XL", "sku": "TSHIRT-XL", "machineMinutesPerUnit": 11, "materialQtyPerUnit": 1.3 }
  ]
}
```

---

### Inventory — `/api/inventory`

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/inventory` | All inventory records |
| `GET` | `/api/inventory/alerts` | Records where qty < reorderPoint |
| `GET` | `/api/inventory/:sku` | Single record by SKU |
| `PUT` | `/api/inventory/:sku` | Update quantityOnHand / reorderPoint |

**Update inventory body:**
```json
{ "quantityOnHand": 250, "reorderPoint": 60 }
```

---

### Demand Forecast — `/api/forecast`

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/forecast/generate` | Run 3-period moving average |
| `GET` | `/api/forecast?period=2025-08` | Get forecasts for a period |
| `GET` | `/api/forecast/periods` | List all stored periods |
| `PATCH` | `/api/forecast/:id/actual` | Record actual sold quantity |

**Generate forecast body:**
```json
{
  "forecastPeriod": "2025-09",
  "historicalData": {
    "TSHIRT-S": [
      { "period": "2025-06", "soldQty": 120 },
      { "period": "2025-07", "soldQty": 140 },
      { "period": "2025-08", "soldQty": 130 }
    ]
  }
}
```

---

### Production Orders — `/api/production-orders`

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/production-orders/generate` | Auto-generate orders from forecasts |
| `GET` | `/api/production-orders` | List orders (filter by `?status=pending`) |
| `GET` | `/api/production-orders/:id` | Order detail with line items |
| `PATCH` | `/api/production-orders/:id/status` | Update order status |

**Generate orders body:**
```json
{ "forecastPeriod": "2025-09" }
```

**Update status body:**
```json
{ "status": "in-progress" }
```

---

### Schedule — `/api/schedule`

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/schedule/generate` | Run EDD scheduling engine |
| `GET` | `/api/schedule?date=2025-09-01` | Slots for a date |
| `GET` | `/api/schedule/utilization?date=2025-09-01` | Machine utilisation % |
| `GET` | `/api/machines` | List all machines |
| `POST` | `/api/machines` | Add a machine |
| `PATCH` | `/api/machines/:id` | Update machine (toggle isOperational etc.) |

**Generate schedule body:**
```json
{ "scheduleDate": "2025-09-01" }
```

---

## 🧮 Algorithm Explanations

### 1. Demand Forecast — 3-Period Moving Average

```
Forecast(t+1) = ceil( [Sold(t) + Sold(t-1) + Sold(t-2)] / 3 )
```

- **Why Moving Average?** Simple, interpretable, and robust for stable demand. No parameter tuning needed.
- **Why `ceil()`?** Production must always round UP — producing 99.3 units is impossible; we produce 100.
- **Graceful degradation:** If fewer than 3 historical periods exist, the average is taken over however many are available.

**Example:**
```
Historical: [120, 140, 130]  →  Forecast = ceil((120+140+130)/3) = ceil(130) = 130
Historical: [120, 140]       →  Forecast = ceil((120+140)/2)     = ceil(130) = 130
```

---

### 2. Planning Engine — Net Requirement Calculation

```
netRequirement = forecastQty - quantityOnHand

If netRequirement > 0  →  Add to Production Order
If netRequirement ≤ 0  →  Skip (sufficient stock)
```

**Grouping rule:** All size variants of the same product are merged into **one** Production Order. This mirrors real factory workflow where a single run covers all size ratios.

**Example:**
```
Forecast 2025-09:  TSHIRT-S = 130,  TSHIRT-M = 143
Inventory:         TSHIRT-S = 30,   TSHIRT-M = 30

Net Requirements:  TSHIRT-S = 100,  TSHIRT-M = 113

→  ONE ProductionOrder for "Classic T-Shirt":
     items: [{ sizeLabel:S, plannedQty:100 }, { sizeLabel:M, plannedQty:113 }]
```

---

### 3. Scheduling Engine — Earliest Due Date (EDD)

EDD is an optimal single-machine scheduling rule that **minimises maximum lateness**.

```
Algorithm:
  1. Sort all PENDING orders by dueDate ASC
  2. Initialise pointers: { machineId → scheduleDate 06:00 }
  3. For each order (in due-date order):
       a. durationMins = Σ(plannedQty × machineMinutesPerUnit)
       b. Select machine with EARLIEST pointer (least-loaded)
       c. startTime = pointer[machine]
          endTime   = startTime + durationMins
       d. Save ScheduleSlot
       e. Advance pointer: pointer[machine] = endTime + 15 min (buffer)
```

**Why EDD?** It guarantees that the order with the closest deadline is always scheduled first, minimising the risk of late deliveries. The 15-minute buffer accounts for machine setup and cleanup between runs.

**Example:**
```
Machines: M1 @ 06:00,  M2 @ 06:00

PO-00001 due Aug-05,  480 min  → M1  (06:00–14:00)  M1 pointer → 14:15
PO-00002 due Aug-07,  180 min  → M2  (06:00–09:00)  M2 pointer → 09:15
PO-00003 due Aug-10,  240 min  → M2  (09:15–13:15)  M2 pointer → 13:30
```

---

## 🧪 Step-by-Step Testing Guide

### Step 1 — Start the app
```bash
npm run seed   # Reset and load demo data
npm run dev    # Start server
```
Open http://localhost:3000 → Dashboard should show:
- 1 Product, 4 Low Stock Alerts, 1 Pending Order

---

### Step 2 — Generate a Forecast

**Via UI:** Go to **Forecast** → paste this into Historical Data and click Run:
```json
{
  "TSHIRT-S":  [{"period":"2025-06","soldQty":120},{"period":"2025-07","soldQty":140},{"period":"2025-08","soldQty":130}],
  "TSHIRT-M":  [{"period":"2025-06","soldQty":90}, {"period":"2025-07","soldQty":100},{"period":"2025-08","soldQty":110}],
  "TSHIRT-L":  [{"period":"2025-06","soldQty":70}, {"period":"2025-07","soldQty":80}, {"period":"2025-08","soldQty":90}],
  "TSHIRT-XL": [{"period":"2025-06","soldQty":50}, {"period":"2025-07","soldQty":60}, {"period":"2025-08","soldQty":70}]
}
```
Period: `2025-09`

**Expected results:**
```
TSHIRT-S  → 130,  TSHIRT-M → 100,  TSHIRT-L → 80,  TSHIRT-XL → 60
```

**Via API (curl):**
```bash
curl -X POST http://localhost:3000/api/forecast/generate \
  -H "Content-Type: application/json" \
  -d '{"forecastPeriod":"2025-09","historicalData":{"TSHIRT-S":[{"period":"2025-06","soldQty":120},{"period":"2025-07","soldQty":140},{"period":"2025-08","soldQty":130}]}}'
```

---

### Step 3 — Generate Production Orders

**Via UI:** Go to **Production Orders** → click "Generate Orders" → enter `2025-09`

**Expected:** 1 PO created for "Classic T-Shirt" with 4 line items, `netRequirement = forecastQty - 30` each.

**Via API:**
```bash
curl -X POST http://localhost:3000/api/production-orders/generate \
  -H "Content-Type: application/json" \
  -d '{"forecastPeriod":"2025-09"}'
```

---

### Step 4 — Generate Schedule

**Via UI:** Go to **Schedule** → click "Generate Schedule" → pick today's date

**Expected:**
```
PO-00002 → Cutting Machine A  06:00 – ??:??  (earliest due date first)
PO-00001 → Sewing Machine B   06:00 – ??:??  (existing seed order)
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/schedule/generate \
  -H "Content-Type: application/json" \
  -d '{"scheduleDate":"2025-09-01"}'
```

---

### Step 5 — Check Machine Utilization
```bash
curl "http://localhost:3000/api/schedule/utilization?date=2025-09-01"
```

Response includes `utilizationPct` per machine and a status label (`idle`, `normal`, `high`, `over-scheduled`).

---

### Step 6 — Update Inventory (resolve low-stock alerts)
```bash
curl -X PUT http://localhost:3000/api/inventory/TSHIRT-S \
  -H "Content-Type: application/json" \
  -d '{"quantityOnHand": 200}'
```

Re-run forecast + orders for 2025-09 → `TSHIRT-S` should be skipped (sufficient stock).

---

## 📄 Licence
MIT
