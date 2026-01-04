import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  selectSavedQueries,
  selectSavedQueriesLoading,
  selectSavedQueriesError,
  selectDeleteLoading,
  selectUpdateLoading,
  setInputText,
  setOutputText,
  updateNodeData,
  removeSavedQueryLocal, // For optimistic updates
} from '../features/flow/flowSlice';
import { format } from 'date-fns';
import { deleteSavedQuery, fetchSavedQueries } from '../features/flow/flowThunks';

const SavedQueriesColumn = () => {
  const dispatch = useDispatch();
  const savedQueries = useSelector(selectSavedQueries);
  const loading = useSelector(selectSavedQueriesLoading);
  const deleteLoading = useSelector(selectDeleteLoading);
  const error = useSelector(selectSavedQueriesError);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editResponse, setEditResponse] = useState('');

  useEffect(() => {
    dispatch(fetchSavedQueries());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSavedQueries());
  };

  const handleDelete = async (queryId) => {
    if (window.confirm('Are you sure you want to delete this saved query?')) {
      // Optimistic update
      dispatch(removeSavedQueryLocal(queryId));
      
      try {
        await dispatch(deleteSavedQuery(queryId)).unwrap();
      } catch (error) {
        // If error, refresh to restore state
        dispatch(fetchSavedQueries());
        alert('Failed to delete query: ' + error.message);
      }
    }
    setAnchorEl(null);
  };

  const handleLoadQuery = (query) => {
    dispatch(setInputText(query.prompt));
    dispatch(setOutputText(query.response));
    
    // Update nodes
    dispatch(updateNodeData({
      nodeId: '1',
      data: { value: query.prompt }
    }));
    
    dispatch(updateNodeData({
      nodeId: '2',
      data: { value: query.response }
    }));
    
    // Close menu if open
    setAnchorEl(null);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a snackbar notification here
  };

  const handleMenuClick = (event, query) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuery(query);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuery(null);
  };

  const handleEditClick = () => {
    if (selectedQuery) {
      setEditPrompt(selectedQuery.prompt);
      setEditResponse(selectedQuery.response);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    handleMenuClose();
  };

  // Filter and sort queries
  const filteredQueries = savedQueries
    .filter(query => 
      query.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.response?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (filter) {
        case 'recent':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  // Format date for display
  const formatDate = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Unknown date';
    }
  };

  // Calculate time ago
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Show loading spinner for specific query being deleted
  const isQueryDeleting = (queryId) => {
    return deleteLoading && selectedQuery?._id === queryId;
  };

  if (loading && savedQueries.length === 0) {
    return (
      <Paper sx={{ flex: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading saved queries...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 320,
        maxWidth: 400,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'success.light',
          color: 'success.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SaveIcon />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Saved Queries
          </Typography>
          <Badge
            badgeContent={savedQueries.length}
            color="primary"
            sx={{ ml: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              sx={{ color: 'inherit' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Filter">
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, { _id: 'filter' })}
              sx={{ color: 'inherit' }}
            >
              <FilterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search saved queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                >
                  <Typography variant="caption">Clear</Typography>
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mx: 2, mt: 1 }}
          action={
            <IconButton
              size="small"
              onClick={handleRefresh}
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Filter Chips */}
      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          size="small"
          color={filter === 'all' ? 'primary' : 'default'}
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Recent"
          size="small"
          color={filter === 'recent' ? 'primary' : 'default'}
          onClick={() => setFilter('recent')}
          variant={filter === 'recent' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Oldest"
          size="small"
          color={filter === 'oldest' ? 'primary' : 'default'}
          onClick={() => setFilter('oldest')}
          variant={filter === 'oldest' ? 'filled' : 'outlined'}
        />
      </Box>

      {/* Queries List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {filteredQueries.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 4,
            }}
          >
            {searchTerm ? (
              <>
                <SearchIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  No matching queries found
                </Typography>
                <Typography variant="body2">
                  Try a different search term
                </Typography>
              </>
            ) : (
              <>
                <SaveIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  No saved queries yet
                </Typography>
                <Typography variant="body2">
                  Save your first query to see it here
                </Typography>
              </>
            )}
          </Box>
        ) : (
          filteredQueries.map((query, index) => (
            <React.Fragment key={query._id || query.id || index}>
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
                    borderColor: 'success.light',
                    cursor: 'pointer',
                  },
                  transition: 'all 0.2s',
                  position: 'relative',
                  opacity: isQueryDeleting(query._id) ? 0.6 : 1,
                }}
                onClick={() => !isQueryDeleting(query._id) && handleLoadQuery(query)}
              >
                {/* Loading indicator for delete */}
                {isQueryDeleting(query._id) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}

                {/* Query Menu */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(e, query);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                  }}
                  disabled={isQueryDeleting(query._id)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                {/* Query Content */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {getTimeAgo(query.timestamp)}
                  </Typography>
                  <CheckCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ opacity: 0.7 }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    mb: 1,
                    color: 'text.primary',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {query.prompt}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.8rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1,
                  }}
                >
                  {query.response}
                </Typography>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`${query.prompt?.length || 0} chars`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${query.response?.length || 0} chars`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Paper>
            </React.Fragment>
          ))
        )}

        {loading && savedQueries.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* Footer Stats */}
      <Divider />
      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Total Saved:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {savedQueries.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Showing:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {filteredQueries.length} of {savedQueries.length}
          </Typography>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedQuery?._id === 'filter' ? (
          [
            <MenuItem key="all" onClick={() => handleFilterChange('all')}>
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>All queries</ListItemText>
            </MenuItem>,
            <MenuItem key="recent" onClick={() => handleFilterChange('recent')}>
              <ListItemIcon>
                <FilterIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Most recent first</ListItemText>
            </MenuItem>,
            <MenuItem key="oldest" onClick={() => handleFilterChange('oldest')}>
              <ListItemIcon>
                <FilterIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Oldest first</ListItemText>
            </MenuItem>,
          ]
        ) : selectedQuery && selectedQuery._id !== 'filter' && (
          [
            <MenuItem
              key="load"
              onClick={() => handleLoadQuery(selectedQuery)}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Load into flow</ListItemText>
            </MenuItem>,
            <MenuItem
              key="edit"
              onClick={handleEditClick}
            >
              <ListItemIcon>
                <VisibilityOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>View query</ListItemText>
            </MenuItem>,
            <MenuItem
              key="copy-prompt"
              onClick={() => {
                handleCopyToClipboard(selectedQuery.prompt);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy prompt</ListItemText>
            </MenuItem>,
            <MenuItem
              key="copy-response"
              onClick={() => {
                handleCopyToClipboard(selectedQuery.response);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy response</ListItemText>
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem
              key="delete"
              onClick={() => handleDelete(selectedQuery._id)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete query</ListItemText>
            </MenuItem>,
          ]
        )}
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Saved Query</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Prompt"
              multiline
              rows={4}
              fullWidth
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Response"
              multiline
              rows={6}
              fullWidth
              value={editResponse}
              onChange={(e) => setEditResponse(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SavedQueriesColumn;