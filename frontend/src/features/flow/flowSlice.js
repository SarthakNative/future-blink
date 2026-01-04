import { createSlice } from '@reduxjs/toolkit';
import { askAI, saveData } from './flowThunks';

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
  history: [],
  currentQueryId: null,
};

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
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
        }
        
        // Update outputText if it's the output node
        if (nodeId === '2' && data.value !== undefined) {
          state.outputText = data.value;
        }
      }
    },
    setInputText: (state, action) => {
      state.inputText = action.payload;
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
    },
    clearHistory: (state) => {
      state.history = [];
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
        state.currentQueryId = action.payload.id;
      })
      .addCase(saveData.rejected, (state) => {
        state.isSaving = false;
      });
  },
});

export const {
  setNodes,
  setEdges,
  updateNodeData,
  setInputText,
  setOutputText,
  addToHistory,
  resetFlow,
  clearHistory,
} = flowSlice.actions;

// Selectors
export const selectNodes = (state) => state.flow.nodes;
export const selectEdges = (state) => state.flow.edges;
export const selectInputText = (state) => state.flow.inputText;
export const selectOutputText = (state) => state.flow.outputText;
export const selectIsFlowRunning = (state) => state.flow.isFlowRunning;
export const selectIsSaving = (state) => state.flow.isSaving;
export const selectHistory = (state) => state.flow.history;
export const selectCurrentQueryId = (state) => state.flow.currentQueryId;

export default flowSlice.reducer;