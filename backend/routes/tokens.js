const express = require('express');
const Token = require('../models/Token');
const Queue = require('../models/Queue');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tokens for a specific queue
router.get('/queue/:queueId', auth, async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.query;

    // Verify queue exists and user owns it
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build filter
    const filter = { queue: queueId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const tokens = await Token.find(filter)
      .sort({ position: 1, createdAt: 1 })
      .populate('queue', 'name');

    res.json(tokens);
  } catch (error) {
    console.error('Get tokens error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while fetching tokens' });
  }
});

// Add a new token to a queue
router.post('/', auth, async (req, res) => {
  try {
    const { queueId, customerName } = req.body;

    // Validation
    if (!queueId) {
      return res.status(400).json({ message: 'Queue ID is required' });
    }

    // Verify queue exists and user owns it
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if queue is active
    if (!queue.isActive) {
      return res.status(400).json({ message: 'Cannot add tokens to an inactive queue' });
    }

    // Get the highest token number and position for this queue
    const lastToken = await Token.findOne({ queue: queueId })
      .sort({ number: -1, position: -1 });

    const nextNumber = lastToken ? lastToken.number + 1 : 1;
    const nextPosition = lastToken ? lastToken.position + 1 : 1;

    // Create token
    const token = new Token({
      number: nextNumber,
      customerName: customerName ? customerName.trim() : `Customer ${nextNumber}`,
      queue: queueId,
      position: nextPosition,
      status: 'waiting'
    });

    await token.save();
    await token.populate('queue', 'name');

    res.status(201).json(token);
  } catch (error) {
    console.error('Create token error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while creating token' });
  }
});

// Move token up in the queue
router.patch('/:id/move-up', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (token.position <= 1) {
      return res.status(400).json({ message: 'Token is already at the top position' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ message: 'Only waiting tokens can be moved' });
    }

    // Find the token that is immediately before this one
    const previousToken = await Token.findOne({
      queue: token.queue._id,
      position: token.position - 1,
      status: 'waiting'
    });

    if (previousToken) {
      // Swap positions
      const tempPosition = previousToken.position;
      previousToken.position = token.position;
      token.position = tempPosition;

      await previousToken.save();
      await token.save();
    }

    await token.populate('queue', 'name');
    res.json(token);
  } catch (error) {
    console.error('Move token up error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while moving token' });
  }
});

// Move token down in the queue
router.patch('/:id/move-down', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ message: 'Only waiting tokens can be moved' });
    }

    // Find the token that is immediately after this one
    const nextToken = await Token.findOne({
      queue: token.queue._id,
      position: token.position + 1,
      status: 'waiting'
    });

    if (!nextToken) {
      return res.status(400).json({ message: 'Token is already at the bottom position' });
    }

    // Swap positions
    const tempPosition = nextToken.position;
    nextToken.position = token.position;
    token.position = tempPosition;

    await nextToken.save();
    await token.save();
    await token.populate('queue', 'name');

    res.json(token);
  } catch (error) {
    console.error('Move token down error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while moving token' });
  }
});

// Assign token for service (call next token)
router.patch('/:id/assign', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ message: 'Only waiting tokens can be assigned for service' });
    }

    // Check if there's already a token being served
    const servingToken = await Token.findOne({
      queue: token.queue._id,
      status: 'serving'
    });

    if (servingToken) {
      return res.status(400).json({ 
        message: 'Another token is currently being served',
        servingToken: servingToken 
      });
    }

    // Update token status
    token.status = 'serving';
    token.calledAt = new Date();
    await token.save();
    await token.populate('queue', 'name');

    res.json(token);
  } catch (error) {
    console.error('Assign token error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while assigning token' });
  }
});

// Complete token service
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (token.status !== 'serving') {
      return res.status(400).json({ message: 'Only serving tokens can be completed' });
    }

    token.status = 'completed';
    token.completedAt = new Date();
    
    // Calculate wait time in minutes
    if (token.calledAt) {
      token.waitTime = Math.round((token.completedAt - token.calledAt) / 1000 / 60);
    }

    await token.save();
    await token.populate('queue', 'name');

    res.json(token);
  } catch (error) {
    console.error('Complete token error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while completing token' });
  }
});

// Cancel a token
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (token.status === 'completed' || token.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel already completed or cancelled token' });
    }

    token.status = 'cancelled';
    await token.save();
    await token.populate('queue', 'name');

    res.json(token);
  } catch (error) {
    console.error('Cancel token error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while cancelling token' });
  }
});

// Delete a token
router.delete('/:id', auth, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queue');

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if the user owns the queue
    if (token.queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deletedPosition = token.position;
    await Token.findByIdAndDelete(req.params.id);

    // Update positions of remaining tokens in the same queue
    await Token.updateMany(
      {
        queue: token.queue._id,
        position: { $gt: deletedPosition },
        status: 'waiting'
      },
      { $inc: { position: -1 } }
    );

    res.json({ 
      message: 'Token deleted successfully',
      deletedTokenId: req.params.id
    });
  } catch (error) {
    console.error('Delete token error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid token ID' });
    }
    res.status(500).json({ message: 'Server error while deleting token' });
  }
});

// Get token statistics
router.get('/stats/queue/:queueId', auth, async (req, res) => {
  try {
    const { queueId } = req.params;

    // Verify queue exists and user owns it
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get token counts by status
    const statusCounts = await Token.aggregate([
      { $match: { queue: queue._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Calculate average wait time for completed tokens
    const avgWaitTime = await Token.aggregate([
      { 
        $match: { 
          queue: queue._id, 
          status: 'completed',
          waitTime: { $gt: 0 }
        } 
      },
      { $group: { _id: null, avgWaitTime: { $avg: '$waitTime' } } }
    ]);

    // Get today's tokens
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTokens = await Token.countDocuments({
      queue: queue._id,
      createdAt: { $gte: today }
    });

    const stats = {
      total: 0,
      waiting: 0,
      serving: 0,
      completed: 0,
      cancelled: 0,
      avgWaitTime: avgWaitTime.length > 0 ? Math.round(avgWaitTime[0].avgWaitTime) : 0,
      todaysTokens: todaysTokens
    };

    // Convert aggregate results to stats object
    statusCounts.forEach(item => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Token stats error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while fetching token statistics' });
  }
});

module.exports = router;