import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic route to check if server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'SuperAdmin Server Online', version: '1.0.0' });
});

// Import and use routes (to be created)
import clientRoutes from './routes/clientRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';

app.use('/api/clients', clientRoutes);
app.use('/api/razorpay', razorpayRoutes);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restopos_superadmin')
.then(() => {
  console.log('Connected to SuperAdmin Database');
  app.listen(PORT, () => console.log(`SuperAdmin Server running on port ${PORT}`));
})
.catch(err => console.error('Database connection error:', err));
