import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  lastRequestId: null,
  requests: {},
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    startRequest: (state, action) => {
      const { requestId, type } = action.payload;
      state.requests[requestId] = {
        type,
        loading: true,
        error: null,
      };
    },
    completeRequest: (state, action) => {
      const { requestId, error } = action.payload;
      if (state.requests[requestId]) {
        state.requests[requestId].loading = false;
        if (error) {
          state.requests[requestId].error = error;
        } else {
          delete state.requests[requestId];
        }
      }
    },
  },
});

export const { setLoading, setError, clearError, startRequest, completeRequest } = apiSlice.actions;

// Selectors
export const selectApiLoading = (state) => state.api.loading;
export const selectApiError = (state) => state.api.error;
export const selectRequestLoading = (requestId) => (state) => 
  state.api.requests[requestId]?.loading || false;
export const selectRequestError = (requestId) => (state) => 
  state.api.requests[requestId]?.error;

export default apiSlice.reducer;