import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';

const QueueManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [servingToken, setServingToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToken, setAddingToken] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:480px)');

  useEffect(() => {
    fetchQueueData();
  }, [id]);

  const fetchQueueData = async () => {
    try {
      const response = await API.get(`/queues/${id}`);
      setQueue(response.data.queue);
      setTokens(response.data.tokens || []);
      setServingToken(response.data.servingToken || null);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch queue data');
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    setAddingToken(true);
    try {
      const response = await API.post('/tokens', { queueId: id });
      setTokens([...tokens, response.data]);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add token');
    }
    setAddingToken(false);
  };

  const handleMoveUp = async (tokenId) => {
    try {
      await API.patch(`/tokens/${tokenId}/move-up`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to move token');
    }
  };

  const handleMoveDown = async (tokenId) => {
    try {
      await API.patch(`/tokens/${tokenId}/move-down`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to move token');
    }
  };

  const handleAssign = async (tokenId) => {
    try {
      await API.patch(`/tokens/${tokenId}/assign`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign token');
    }
  };

  const handleComplete = async (tokenId) => {
    try {
      await API.patch(`/tokens/${tokenId}/complete`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to complete token');
    }
  };

  const handleCancel = async (tokenId) => {
    try {
      await API.patch(`/tokens/${tokenId}/cancel`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cancel token');
    }
  };

  const handleDelete = async (tokenId) => {
    try {
      await API.delete(`/tokens/${tokenId}`);
      fetchQueueData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete token');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!queue) {
    return (
      <Box>
        <Alert severity="error">Queue not found</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const waitingTokens = tokens.filter(token => token.status === 'waiting');
  const completedTokens = tokens.filter(token => token.status === 'completed');
  const cancelledTokens = tokens.filter(token => token.status === 'cancelled');

  return (
    <Box sx={{ px: { xs: 1, sm: 2 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
          {queue.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddToken}
          disabled={addingToken}
          size={isSmallMobile ? "small" : "medium"}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          {addingToken ? 'Adding...' : 'Add Token'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={isSmallMobile ? 1 : 3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Tokens in Queue ({tokens.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {servingToken && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Currently Serving:
                  </Typography>
                  <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                          Token #{servingToken.number}
                        </Typography>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleComplete(servingToken._id)}
                          size={isSmallMobile ? "small" : "medium"}
                          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                        >
                          Complete Service
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {waitingTokens.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    No tokens waiting in this queue.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  <AnimatePresence>
                    {waitingTokens.map((token) => (
                      <motion.div
                        key={token._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ListItem
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'background.paper',
                            p: { xs: 1, sm: 2 },
                          }}
                        >
                          <ListItemText
                            primary={`Token #${token.number}`}
                            secondary={`Position: ${token.position}`}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                              },
                              '& .MuiListItemText-secondary': {
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }
                            }}
                          />
                          <ListItemSecondaryAction>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              <IconButton
                                size="small"
                                onClick={() => handleMoveUp(token._id)}
                                disabled={token.position === 1}
                                color="primary"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                <ArrowUpIcon fontSize={isSmallMobile ? "small" : "medium"} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveDown(token._id)}
                                disabled={token.position === waitingTokens.length}
                                color="primary"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                <ArrowDownIcon fontSize={isSmallMobile ? "small" : "medium"} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleAssign(token._id)}
                                color="primary"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                <CheckIcon fontSize={isSmallMobile ? "small" : "medium"} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleCancel(token._id)}
                                color="error"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                <CloseIcon fontSize={isSmallMobile ? "small" : "medium"} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(token._id)}
                                color="error"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                <DeleteIcon fontSize={isSmallMobile ? "small" : "medium"} />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Queue Stats
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Total Tokens: {tokens.length}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Waiting: {waitingTokens.length}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Serving: {servingToken ? 1 : 0}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Completed: {completedTokens.length}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Cancelled: {cancelledTokens.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: isSmallMobile ? 2 : 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  onClick={handleAddToken}
                  disabled={addingToken}
                  startIcon={<AddIcon />}
                  size={isSmallMobile ? "small" : "medium"}
                >
                  Add Token
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/analytics/${id}`)}
                  startIcon={<AnalyticsIcon />}
                  size={isSmallMobile ? "small" : "medium"}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  size={isSmallMobile ? "small" : "medium"}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>

          {completedTokens.length > 0 && (
            <Card sx={{ mt: isSmallMobile ? 2 : 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Recently Completed
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {completedTokens.slice(-5).reverse().map((token) => (
                    <Typography 
                      key={token._id} 
                      variant="body2" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Token #{token.number} - {token.waitTime} min wait
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default QueueManager;