import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import SavedQueriesColumn from './SavedQueriesColumn';
import {
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  setNodes,
  setEdges,
  updateNodeData,
  setInputText,
  resetFlow,
  selectNodes,
  selectEdges,
  selectInputText,
  selectOutputText,
  selectIsFlowRunning,
  selectIsSaving,
  selectIsSaved,
} from '../features/flow/flowSlice';
import { askAI, saveData } from '../features/flow/flowThunks';
import { selectApiError, clearError, selectRequestLoading } from '../features/api/apiSlice';
import Loader from './Loader';
import ErrorAlert from './ErrorAlert';

// Node types configuration
const nodeTypes = {
  inputNode: CustomNode,
  outputNode: CustomNode,
};

const FlowChart = () => {
  const dispatch = useDispatch();

  // Selectors
  const nodes = useSelector(selectNodes);
  const edges = useSelector(selectEdges);
  const inputText = useSelector(selectInputText);
  const outputText = useSelector(selectOutputText);
  const isFlowRunning = useSelector(selectIsFlowRunning);
  const isSaving = useSelector(selectIsSaving);
  const isSaved = useSelector(selectIsSaved);
  const apiError = useSelector(selectApiError);

  // Check specific request loading states
  const isAILoading = useSelector(selectRequestLoading('askAI'));
  const isSaveLoading = useSelector(selectRequestLoading('saveData'));

  // React Flow state - synchronized with Redux
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  // Handle input node text change
  const handleInputChange = useCallback((value) => {
    dispatch(setInputText(value));
    dispatch(updateNodeData({
      nodeId: '1',
      data: { value }
    }));
  }, [dispatch]);

  const handleRunFlow = async () => {
    if (!inputText.trim()) {
      dispatch(clearError());
      dispatch(setError('Please enter a question'));
      return;
    }

    try {
      const result = await dispatch(askAI(inputText)).unwrap();

      // Update output node with AI response
      dispatch(updateNodeData({
        nodeId: '2',
        data: { value: result.response }
      }));

    } catch (error) {
      console.error('Failed to run flow:', error);
      // Update output node with error message
      dispatch(updateNodeData({
        nodeId: '2',
        data: {
          value: `Error: ${error.message || 'Failed to get AI response'}`
        }
      }));
    }
  };

  const handleSave = async () => {
    if (!inputText.trim() || !outputText.trim()) {
      dispatch(clearError());
      dispatch(setError('No data to save'));
      return;
    }

    try {
      await dispatch(saveData({
        prompt: inputText,
        response: outputText,
        timestamp: new Date().toISOString(),
      })).unwrap();

    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleReset = () => {
    dispatch(resetFlow());
    setReactFlowNodes(nodes);
    setReactFlowEdges(edges);
  };

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}-${Date.now()}`,
      };
      setReactFlowEdges((eds) => addEdge(newEdge, eds));
      dispatch(setEdges([...edges, newEdge]));
    },
    [dispatch, edges, setReactFlowEdges]
  );

  // Sync Redux nodes with React Flow nodes
  useEffect(() => {
    const updatedNodes = nodes.map(node => {
      if (node.id === '1') {
        return {
          ...node,
          type: 'inputNode',
          data: {
            ...node.data,
            nodeType: 'input',
            onChange: handleInputChange,
            isRunning: isFlowRunning || isAILoading,
          }
        };
      } else if (node.id === '2') {
        return {
          ...node,
          type: 'outputNode',
          data: {
            ...node.data,
            nodeType: 'output',
            isRunning: isFlowRunning || isAILoading,
          }
        };
      }
      return node;
    });

    setReactFlowNodes(updatedNodes);
  }, [nodes, isFlowRunning, isAILoading, handleInputChange, setReactFlowNodes]);

  // Sync Redux edges with React Flow edges
  useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const node = reactFlowNodes.find(n => n.id === change.id);
        if (node) {
          dispatch(setNodes(
            nodes.map(n =>
              n.id === change.id
                ? { ...n, position: change.position }
                : n
            )
          ));
        }
      }
    });
  }, [dispatch, nodes, reactFlowNodes, onNodesChange]);

  const handleCloseError = () => {
    dispatch(clearError());
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', gap: 2, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Column: Saved Queries */}
        <Box
          sx={{
            flex: 1,
            minWidth: 320,
            maxWidth: 400,
            display: 'flex',
            minHeight: 0,
            height:'80vh'
          }}
        >
          <SavedQueriesColumn />
        </Box>


        {/* Middle Column: Flow Chart */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 ,  height:'80vh'}}>
          <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                AI Flow Processing
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Tooltip title="Run AI Flow">
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleRunFlow}
                      disabled={isFlowRunning || isAILoading || !inputText.trim()}
                      sx={{ minWidth: 120 }}
                    >
                      {(isFlowRunning || isAILoading) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Loader size={16} />
                          Processing
                        </Box>
                      ) : 'Run Flow'}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title={isSaved ? "Already saved" : "Save to Database"}>
                  <span>
                    <Button
                      variant={isSaved ? "contained" : "outlined"}
                      color={isSaved ? "success" : "primary"}
                      startIcon={
                        isSaved ? (
                          <CheckCircleIcon />
                        ) : isSaving || isSaveLoading ? (
                          <Loader size={16} />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={handleSave}
                      disabled={
                        isSaving ||
                        isSaveLoading ||
                        isSaved ||
                        !inputText.trim() ||
                        !outputText.trim()
                      }
                    >
                      {isSaving || isSaveLoading ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Reset Flow">
                  <IconButton
                    onClick={handleReset}
                    color="warning"
                    disabled={isFlowRunning || isAILoading}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Save Status Indicator */}
            {isSaved && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 1,
                p: 1,
                backgroundColor: 'success.light',
                color: 'success.contrastText',
                borderRadius: 1,
              }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption">
                  Current query is saved. Change the prompt to save again.
                </Typography>
              </Box>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              position: 'relative',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {(isFlowRunning || isAILoading) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Loader
                  message="Processing AI request..."
                  size={48}
                />
              </Box>
            )}

            <ReactFlow
              nodes={reactFlowNodes}
              edges={reactFlowEdges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
            >
              <Controls />
              <MiniMap
                style={{
                  backgroundColor: '#f8f9fa',
                }}
                nodeStrokeColor={(node) => {
                  if (node.type === 'inputNode') return '#1976d2';
                  if (node.type === 'outputNode') return '#dc004e';
                  return '#ccc';
                }}
                nodeColor={(node) => {
                  if (node.type === 'inputNode') return '#e3f2fd';
                  if (node.type === 'outputNode') return '#fce4ec';
                  return '#fff';
                }}
              />
              <Background
                variant="dots"
                gap={20}
                size={1}
                color="#e0e0e0"
              />
            </ReactFlow>
          </Paper>
        </Box>

      </Box>

      {/* Global Error Alert */}
      <ErrorAlert
        error={apiError}
        open={!!apiError}
        onClose={handleCloseError}
      />
    </>
  );
};

export default FlowChart;