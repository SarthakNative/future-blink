import { createAsyncThunk } from '@reduxjs/toolkit';
import { aiService } from '../../services/apiService';
import { startRequest, completeRequest } from '../api/apiSlice';

// Generate unique request IDs
const generateRequestId = (type) => `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const askAI = createAsyncThunk(
  'flow/askAI',
  async (prompt, { dispatch, rejectWithValue }) => {
    const requestId = generateRequestId('askAI');
    
    try {
      dispatch(startRequest({ requestId, type: 'askAI' }));
      
      const response = await aiService.askAI(prompt);
      
      dispatch(completeRequest({ requestId }));
      
      return response.data;
    } catch (error) {
      dispatch(completeRequest({ requestId, error: error.message }));
      return rejectWithValue({
        message: error.message,
        status: error.status,
        data: error.data,
      });
    }
  }
);

export const saveData = createAsyncThunk(
  'flow/saveData',
  async (data, { dispatch, rejectWithValue, getState }) => {
    const requestId = generateRequestId('saveData');
    
    try {
      dispatch(startRequest({ requestId, type: 'saveData' }));
      
      const response = await aiService.saveData(data);
      
      dispatch(completeRequest({ requestId }));
      
      return response.data;
    } catch (error) {
      dispatch(completeRequest({ requestId, error: error.message }));
      return rejectWithValue({
        message: error.message,
        status: error.status,
        data: error.data,
      });
    }
  }
);