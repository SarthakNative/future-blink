const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const aiRoutes = require('./routes/ai.routes');
const dbRoutes = require('./routes/db.routes');

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