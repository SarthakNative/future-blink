import express from 'express';
import mongoose from 'mongoose';
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

router.get('/queries', async (req, res) => {
  try {
    const queries = await Query.find()
      .sort({ timestamp: -1 }) // Sort by most recent first
      .limit(100); // Limit to 100 queries
    
    res.json(queries);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

// Delete a saved query (NEW)
router.delete('/queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid query ID' });
    }

    const result = await Query.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Query not found' });
    }
    
    res.json({ 
      message: 'Query deleted successfully',
      id: id 
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete query' });
  }
});


export default router;