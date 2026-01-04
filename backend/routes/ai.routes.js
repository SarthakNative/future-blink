const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST endpoint for AI requests
router.post('/ask-ai', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || 'No response received';
    
    res.json({ 
      response: aiResponse,
      model: response.data.model 
    });

  } catch (error) {
    console.error('AI API Error:', error.response?.data || error.message);
    
    // Provide fallback response for free tier limitations
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        response: 'Free tier limit reached. This is a mock response for demonstration.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

module.exports = router;