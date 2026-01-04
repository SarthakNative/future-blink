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
import HistoryIcon from '@mui/icons-material/History';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  setNodes,
  setEdges,
  updateNodeData,
  setInputText,
  resetFlow,
  clearHistory,
  selectNodes,
  selectEdges,
  selectInputText,
  selectOutputText,
  selectIsFlowRunning,
  selectIsSaving,
  selectIsSaved,
  selectHistory,
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
  const history = useSelector(selectHistory);
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

  const handleClearHistory = () => {
    dispatch(clearHistory());
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
      <Box sx={{ display: 'flex', height: '90vh', gap: 2, overflow: 'hidden' }}>
        {/* Left Column: Saved Queries */}
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: 400 }}>
          <SavedQueriesColumn />
        </Box>

        {/* Middle Column: Flow Chart */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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

        {/* Right Column: Query History */}
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: 400 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              flex: 1,
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* History Header */}
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Query History
                </Typography>
                <Badge 
                  badgeContent={history.length} 
                  color="secondary"
                  sx={{ ml: 1 }}
                />
              </Box>
              
              {history.length > 0 && (
                <Tooltip title="Clear History">
                  <IconButton 
                    size="small" 
                    onClick={handleClearHistory}
                    sx={{ color: 'white' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {/* History List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {history.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                  textAlign: 'center',
                  p: 4,
                }}>
                  <HistoryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    No queries yet
                  </Typography>
                  <Typography variant="body2">
                    Run your first AI query to see history here
                  </Typography>
                </Box>
              ) : (
                history.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index === 0 || 
                     formatDate(history[index - 1].timestamp) !== formatDate(item.timestamp) ? (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: index === 0 ? 0 : 2,
                          mb: 1, 
                          color: 'text.secondary',
                          fontWeight: 500,
                        }}
                      >
                        {formatDate(item.timestamp)}
                      </Typography>
                    ) : null}
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        backgroundColor: 'background.default',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.light',
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(item.timestamp)}
                        </Typography>
                        {item.model && (
                          <Chip 
                            label={item.model.split('/').pop()} 
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        {item.prompt.length > 80 ? `${item.prompt.substring(0, 80)}...` : item.prompt}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.8rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.response.length > 100 ? `${item.response.substring(0, 100)}...` : item.response}
                      </Typography>
                    </Paper>
                  </React.Fragment>
                ))
              )}
            </Box>
            
            {/* Stats Footer */}
            <Divider />
            <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Queries:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {history.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip 
                  label={isFlowRunning || isAILoading ? 'Processing' : 'Ready'} 
                  size="small"
                  color={isFlowRunning || isAILoading ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Box>
            </Box>
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