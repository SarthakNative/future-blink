import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Handle, Position } from 'reactflow';
import { 
  Box, 
  TextField, 
  Typography, 
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import { 
  setInputText,
  updateNodeData,
  selectIsFlowRunning,
} from '../features/flow/flowSlice';
import { selectRequestLoading } from '../features/api/apiSlice';

const CustomNode = ({ id, data }) => {
  const dispatch = useDispatch();
  
  // Get loading states from Redux
  const isFlowRunning = useSelector(selectIsFlowRunning);
  const isAILoading = useSelector(selectRequestLoading('askAI'));
  
  // Determine node type from data or id
  const nodeType = data?.nodeType || (id === '1' ? 'input' : 'output');
  
  const handleInputChange = (value) => {
    if (nodeType === 'input') {
      dispatch(setInputText(value));
      dispatch(updateNodeData({
        nodeId: id,
        data: { value }
      }));
    }
  };

  // Common loading state
  const isLoading = isFlowRunning || isAILoading;

  if (nodeType === 'input') {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 2.5, 
          minWidth: 240,
          maxWidth: 320,
          border: '2px solid',
          borderColor: isLoading ? 'primary.main' : 'transparent',
          boxShadow: isLoading ? '0 0 0 2px rgba(25, 118, 210, 0.1)' : 3,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left handle for output connection */}
        <Handle 
          type="source" 
          position={Position.Right}
          style={{
            width: 12,
            height: 12,
            background: '#1976d2',
            border: '2px solid white',
          }}
        />
        
        {/* Node Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InputIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600} color="primary">
            Input Node
          </Typography>
          {isLoading && (
            <Chip 
              label="Processing" 
              size="small" 
              color="warning"
              icon={<CircularProgress size={14} />}
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>
        
        {/* Input Field */}
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={data?.value || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter your question here..."
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: isLoading ? 'action.hover' : 'white',
              transition: 'background-color 0.3s',
            },
          }}
        />
        
        {/* Character Counter */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block',
            textAlign: 'right',
            mt: 1,
          }}
        >
          {data?.value?.length || 0} characters
        </Typography>
      </Paper>
    );
  }

  if (nodeType === 'output') {
    const displayValue = data?.value || 'AI response will appear here...';
    const isEmpty = !data?.value;
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 2.5, 
          minWidth: 240,
          maxWidth: 320,
          border: '2px solid',
          borderColor: isLoading ? 'secondary.main' : 'transparent',
          boxShadow: isLoading ? '0 0 0 2px rgba(220, 0, 78, 0.1)' : 3,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Right handle for input connection */}
        <Handle 
          type="target" 
          position={Position.Left}
          style={{
            width: 12,
            height: 12,
            background: '#dc004e',
            border: '2px solid white',
          }}
        />
        
        {/* Node Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <OutputIcon color="secondary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600} color="secondary">
            Result Node
          </Typography>
          {isLoading && (
            <Chip 
              label="Waiting..." 
              size="small" 
              color="warning"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>
        
        {/* Output Display */}
        <Box 
          sx={{ 
            minHeight: 120, 
            p: 2.5,
            border: '1px solid',
            borderColor: isEmpty ? 'divider' : 'secondary.light',
            borderRadius: 1.5,
            backgroundColor: isEmpty ? 'grey.50' : 'background.paper',
            position: 'relative',
            transition: 'all 0.3s',
          }}
        >
          {isLoading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              gap: 1.5,
            }}>
              <CircularProgress size={32} color="secondary" />
              <Typography variant="body2" color="text.secondary">
                Generating AI response...
              </Typography>
            </Box>
          ) : isEmpty ? (
            <Typography 
              variant="body2" 
              color="text.secondary"
              align="center"
              sx={{ 
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              Run the flow to see AI response
            </Typography>
          ) : (
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
              }}
            >
              {displayValue}
            </Typography>
          )}
          
          {/* Response indicator */}
          {!isLoading && !isEmpty && (
            <Chip 
              label="AI Response" 
              size="small" 
              color="secondary"
              variant="outlined"
              sx={{ 
                position: 'absolute',
                top: -10,
                right: 10,
                backgroundColor: 'white',
              }}
            />
          )}
        </Box>
        
        {/* Response stats */}
        {!isLoading && !isEmpty && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              textAlign: 'right',
              mt: 1,
            }}
          >
            {displayValue.length} characters • {displayValue.split(/\s+/).length} words
          </Typography>
        )}
      </Paper>
    );
  }

  return null;
};

export default CustomNode;