import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [newQueueDescription, setNewQueueDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      const response = await API.get('/queues');
      setQueues(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch queues');
      setLoading(false);
    }
  };

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return;
    
    setCreating(true);
    try {
      const response = await API.post('/queues', { 
        name: newQueueName,
        description: newQueueDescription 
      });
      setQueues([...queues, response.data]);
      setNewQueueName('');
      setNewQueueDescription('');
      setCreateDialogOpen(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create queue');
    }
    setCreating(false);
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      await API.delete(`/queues/${queueId}`);
      setQueues(queues.filter(q => q._id !== queueId));
      setActionAnchorEl(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete queue');
    }
  };

  const handleSort = (sortBy) => {
    const sortedQueues = [...queues];
    switch(sortBy) {
      case 'name':
        sortedQueues.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        sortedQueues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        sortedQueues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }
    setQueues(sortedQueues);
    setSortAnchorEl(null);
  };

  const handleActionMenuOpen = (event, queue) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedQueue(queue);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
    setSelectedQueue(null);
  };

  const MotionCard = motion(Card);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Queue Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all your queues in one place
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchQueues}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<SortIcon />}
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
            variant="outlined"
          >
            Sort
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Queue
          </Button>
        </Box>
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSort('name')}>By Name</MenuItem>
        <MenuItem onClick={() => handleSort('newest')}>Newest First</MenuItem>
        <MenuItem onClick={() => handleSort('oldest')}>Oldest First</MenuItem>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/queue/${selectedQueue?._id}`);
          handleActionMenuClose();
        }}>
          Manage Queue
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/analytics/${selectedQueue?._id}`);
          handleActionMenuClose();
        }}>
          View Analytics
        </MenuItem>
        <MenuItem onClick={() => handleDeleteQueue(selectedQueue?._id)} sx={{ color: 'error.main' }}>
          Delete Queue
        </MenuItem>
      </Menu>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {queues.length === 0 ? (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No queues yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first queue to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Queue
            </Button>
          </CardContent>
        </MotionCard>
      ) : (
        <Grid container spacing={3}>
          {queues.map((queue, index) => (
            <Grid item xs={12} md={6} lg={4} key={queue._id}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom sx={{ flexGrow: 1, pr: 1 }}>
                      {queue.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, queue)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created: {new Date(queue.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  {queue.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {queue.description}
                    </Typography>
                  )}
                  
                  <Chip
                    label={queue.isActive ? 'Active' : 'Inactive'}
                    color={queue.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayIcon />}
                      onClick={() => navigate(`/queue/${queue._id}`)}
                      sx={{ flexGrow: 1 }}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AnalyticsIcon />}
                      onClick={() => navigate(`/analytics/${queue._id}`)}
                      sx={{ flexGrow: 1 }}
                    >
                      Analytics
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Queue Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Queue</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Queue Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newQueueName}
            onChange={(e) => setNewQueueName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newQueueDescription}
            onChange={(e) => setNewQueueDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateQueue} 
            variant="contained"
            disabled={creating || !newQueueName.trim()}
          >
            {creating ? 'Creating...' : 'Create Queue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;