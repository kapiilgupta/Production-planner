import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import forecastRoutes from './routes/forecast.js';
import planningRoutes from './routes/planning.js';
import scheduleRoutes from './routes/schedule.js';
import machineRoutes from './routes/machines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(morgan(process.env.LOG_LEVEL || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.render('dashboard', {
    title:    'Dashboard | Production Planner',
    appName:  process.env.APP_NAME || 'Production Planner',
  });
});

app.get('/products',          (req, res) => res.render('products/index',   { title: 'Products'          }));
app.get('/inventory',         (req, res) => res.render('inventory/index',  { title: 'Inventory'         }));
app.get('/forecast',          (req, res) => res.render('forecast/index',   { title: 'Demand Forecast'   }));
app.get('/planning',          (req, res) => res.render('planning/index',   { title: 'Production Orders' }));
app.get('/orders',            (req, res) => res.render('planning/index',   { title: 'Production Orders' }));
app.get('/schedule',          (req, res) => res.render('schedule/index',   { title: 'Schedule'          }));
app.get('/machines',          (req, res) => res.render('machines/index',   { title: 'Machines'          }));

app.use('/api/products',           productRoutes);
app.use('/api/inventory',          inventoryRoutes);
app.use('/api/forecast',           forecastRoutes);
app.use('/api/production-orders',  planningRoutes);
app.use('/api/schedule',           scheduleRoutes);
app.use('/api/machines',           machineRoutes);

app.use('/api/*path', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((req, res) => {
  res.status(404).render('404', { title: '404 – Page Not Found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀  Production Planner running on http://localhost:${PORT}`);
  console.log(`    Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`    MongoDB URI : ${process.env.MONGO_URI}`);
});

export default app;
