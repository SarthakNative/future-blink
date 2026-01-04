const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Define schema
const querySchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Create model
const Query = mongoose.model('Query', querySchema);

// Save endpoint
router.post('/save', async (req, res) => {
  try {
    const { prompt, response } = req.body;

    if (!prompt || !response) {
      return res.status(400).json({ error: 'Prompt and response are required' });
    }

    const newQuery = new Query({
      prompt,
      response,
      timestamp: new Date()
    });

    await newQuery.save();

    res.json({ 
      message: 'Data saved successfully',
      id: newQuery._id 
    });

  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Get all queries endpoint (optional)
router.get('/queries', async (req, res) => {
  try {
    const queries = await Query.find().sort({ timestamp: -1 });
    res.json(queries);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

module.exports = router;