import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/database.js';
import aiRoutes from './routes/ai.routes.js';
import dbRoutes from './routes/db.routes.js';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', aiRoutes);
app.use('/api', dbRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'AI Flow Backend API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});