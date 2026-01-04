import { createSlice } from '@reduxjs/toolkit';
import { 
  askAI, 
  saveData, 
  fetchSavedQueries, 
  deleteSavedQuery, 
} from './flowThunks';

const initialNodes = [
  {
    id: '1',
    type: 'inputNode',
    data: { 
      label: 'Input Node',
      value: '',
    },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'outputNode',
    data: { 
      label: 'Output Node', 
      value: '',
    },
    position: { x: 400, y: 100 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

const initialState = {
  nodes: initialNodes,
  edges: initialEdges,
  inputText: '',
  outputText: '',
  isFlowRunning: false,
  isSaving: false,
  isSaved: false,
  lastSavedText: '',
  history: [],
  savedQueries: [],
  currentQueryId: null,
  savedQueriesLoading: false,
  savedQueriesError: null,
  deleteLoading: false,
  updateLoading: false,
  editDialogOpen: false,
};

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    setEditDialogOpen: (state, action) => {
      state.editDialogOpen = action.payload;
    },
    setNodes: (state, action) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action) => {
      state.edges = action.payload;
    },
    updateNodeData: (state, action) => {
      const { nodeId, data } = action.payload;
      const nodeIndex = state.nodes.findIndex(node => node.id === nodeId);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex].data = {
          ...state.nodes[nodeIndex].data,
          ...data,
        };
        
        // Update inputText if it's the input node
        if (nodeId === '1' && data.value !== undefined) {
          state.inputText = data.value;
          
          // Check if text has changed since last save
          if (state.inputText !== state.lastSavedText) {
            state.isSaved = false;
          }
        }
        
        // Update outputText if it's the output node
        if (nodeId === '2' && data.value !== undefined) {
          state.outputText = data.value;
        }
      }
    },
    setInputText: (state, action) => {
      state.inputText = action.payload;
      
      // Check if text has changed since last save
      if (state.inputText !== state.lastSavedText) {
        state.isSaved = false;
      }
      
      // Update input node
      const inputNodeIndex = state.nodes.findIndex(node => node.id === '1');
      if (inputNodeIndex !== -1) {
        state.nodes[inputNodeIndex].data.value = action.payload;
      }
    },
    setOutputText: (state, action) => {
      state.outputText = action.payload;
      // Update output node
      const outputNodeIndex = state.nodes.findIndex(node => node.id === '2');
      if (outputNodeIndex !== -1) {
        state.nodes[outputNodeIndex].data.value = action.payload;
      }
    },
    setSavedStatus: (state, action) => {
      state.isSaved = action.payload;
      if (action.payload) {
        state.lastSavedText = state.inputText;
      }
    },
    addToHistory: (state, action) => {
      state.history.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      // Keep only last 10 items
      if (state.history.length > 10) {
        state.history.pop();
      }
    },
    resetFlow: (state) => {
      state.nodes = initialNodes;
      state.edges = initialEdges;
      state.inputText = '';
      state.outputText = '';
      state.isFlowRunning = false;
      state.isSaving = false;
      state.isSaved = false;
      state.lastSavedText = '';
    },
    clearHistory: (state) => {
      state.history = [];
    },
    setSavedQueries: (state, action) => {
      state.savedQueries = action.payload;
    },
    setSavedQueriesLoading: (state, action) => {
      state.savedQueriesLoading = action.payload;
    },
    setSavedQueriesError: (state, action) => {
      state.savedQueriesError = action.payload;
    },
    // Manual reducer for immediate UI update
    removeSavedQueryLocal: (state, action) => {
      state.savedQueries = state.savedQueries.filter(
        query => query._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle askAI thunk
      .addCase(askAI.pending, (state) => {
        state.isFlowRunning = true;
      })
      .addCase(askAI.fulfilled, (state, action) => {
        state.isFlowRunning = false;
        state.outputText = action.payload.response;
        
        // Update output node
        const outputNodeIndex = state.nodes.findIndex(node => node.id === '2');
        if (outputNodeIndex !== -1) {
          state.nodes[outputNodeIndex].data.value = action.payload.response;
        }
        
        // Reset saved status when new AI response is generated
        state.isSaved = false;
        
        // Add to history
        state.history.unshift({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          prompt: state.inputText,
          response: action.payload.response,
          model: action.payload.model,
        });
      })
      .addCase(askAI.rejected, (state) => {
        state.isFlowRunning = false;
      })
      
      // Handle saveData thunk
      .addCase(saveData.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveData.fulfilled, (state, action) => {
        state.isSaving = false;
        state.isSaved = true;
        state.lastSavedText = state.inputText;
        state.currentQueryId = action.payload.id;
        
        // Refresh saved queries after saving
        if (action.payload.id) {
          // Add to saved queries if not already present
          const exists = state.savedQueries.some(q => q._id === action.payload.id);
          if (!exists) {
            state.savedQueries.unshift({
              _id: action.payload.id,
              prompt: state.inputText,
              response: state.outputText,
              timestamp: new Date().toISOString(),
            });
          }
        }
      })
      .addCase(saveData.rejected, (state) => {
        state.isSaving = false;
        state.isSaved = false;
      })
      
      // Handle fetchSavedQueries thunk
      .addCase(fetchSavedQueries.pending, (state) => {
        state.savedQueriesLoading = true;
        state.savedQueriesError = null;
      })
      .addCase(fetchSavedQueries.fulfilled, (state, action) => {
        state.savedQueriesLoading = false;
        state.savedQueries = action.payload;
      })
      .addCase(fetchSavedQueries.rejected, (state, action) => {
        state.savedQueriesLoading = false;
        state.savedQueriesError = action.payload.message;
      })
      
      // Handle deleteSavedQuery thunk
      .addCase(deleteSavedQuery.pending, (state) => {
        state.deleteLoading = true;
      })
      .addCase(deleteSavedQuery.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove from state
        state.savedQueries = state.savedQueries.filter(
          query => query._id !== action.payload
        );
        
        // If we deleted the currently saved query, reset saved status
        if (state.currentQueryId === action.payload) {
          state.isSaved = false;
          state.currentQueryId = null;
          state.lastSavedText = '';
        }
      })
      .addCase(deleteSavedQuery.rejected, (state, action) => {
        state.deleteLoading = false;
        state.savedQueriesError = action.payload.message;
      })
  },
});

export const {
  setEditDialogOpen,
  setNodes,
  setEdges,
  updateNodeData,
  setInputText,
  setOutputText,
  setSavedStatus,
  addToHistory,
  resetFlow,
  clearHistory,
  setSavedQueries,
  setSavedQueriesLoading,
  setSavedQueriesError,
  removeSavedQueryLocal,
} = flowSlice.actions;

// Selectors
export const selectNodes = (state) => state.flow.nodes;
export const selectEdges = (state) => state.flow.edges;
export const selectInputText = (state) => state.flow.inputText;
export const selectOutputText = (state) => state.flow.outputText;
export const selectIsFlowRunning = (state) => state.flow.isFlowRunning;
export const selectIsSaving = (state) => state.flow.isSaving;
export const selectIsSaved = (state) => state.flow.isSaved;
export const selectHistory = (state) => state.flow.history;
export const selectSavedQueries = (state) => state.flow.savedQueries;
export const selectSavedQueriesLoading = (state) => state.flow.savedQueriesLoading;
export const selectSavedQueriesError = (state) => state.flow.savedQueriesError;
export const selectDeleteLoading = (state) => state.flow.deleteLoading;
export const selectUpdateLoading = (state) => state.flow.updateLoading;
export const selectCurrentQueryId = (state) => state.flow.currentQueryId;
export const selectLastSavedText = (state) => state.flow.lastSavedText;
export const selectEditDialogOpen = (state) => state.flow.editDialogOpen;
export default flowSlice.reducer;