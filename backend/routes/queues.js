const express = require('express');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all queues for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const queues = await Queue.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');
    
    res.json(queues);
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({ message: 'Server error while fetching queues' });
  }
});

// Create a new queue
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Queue name is required' });
    }

    // Check if queue name already exists for this user
    const existingQueue = await Queue.findOne({ 
      name: name.trim(), 
      createdBy: req.user.id 
    });
    
    if (existingQueue) {
      return res.status(400).json({ message: 'You already have a queue with this name' });
    }

    // Create queue
    const queue = new Queue({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user.id
    });

    await queue.save();
    await queue.populate('createdBy', 'username');

    res.status(201).json(queue);
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({ message: 'Server error while creating queue' });
  }
});

// Get a specific queue with its tokens
router.get('/:id', auth, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Check if the user owns this queue
    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this queue' });
    }

    // Get waiting tokens for this queue, sorted by position
    const tokens = await Token.find({ 
      queue: req.params.id, 
      status: 'waiting' 
    }).sort({ position: 1 });

    // Get serving token if exists
    const servingToken = await Token.findOne({
      queue: req.params.id,
      status: 'serving'
    });

    // Get queue statistics
    const totalTokens = await Token.countDocuments({ queue: req.params.id });
    const completedTokens = await Token.countDocuments({ 
      queue: req.params.id, 
      status: 'completed' 
    });
    const cancelledTokens = await Token.countDocuments({ 
      queue: req.params.id, 
      status: 'cancelled' 
    });

    res.json({
      queue,
      tokens,
      servingToken,
      statistics: {
        total: totalTokens,
        waiting: tokens.length,
        serving: servingToken ? 1 : 0,
        completed: completedTokens,
        cancelled: cancelledTokens
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while fetching queue' });
  }
});

// Update a queue
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Check if the user owns this queue
    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if new name already exists (excluding current queue)
    if (name && name.trim() !== queue.name) {
      const existingQueue = await Queue.findOne({
        name: name.trim(),
        createdBy: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingQueue) {
        return res.status(400).json({ message: 'You already have another queue with this name' });
      }

      queue.name = name.trim();
    }

    if (description !== undefined) {
      queue.description = description.trim();
    }

    if (isActive !== undefined) {
      queue.isActive = isActive;
    }

    await queue.save();
    await queue.populate('createdBy', 'username');

    res.json(queue);
  } catch (error) {
    console.error('Update queue error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while updating queue' });
  }
});

// Delete a queue and all its tokens
router.delete('/:id', auth, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Check if the user owns this queue
    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all tokens associated with this queue
    await Token.deleteMany({ queue: req.params.id });

    // Delete the queue
    await Queue.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Queue and all associated tokens deleted successfully',
      deletedQueueId: req.params.id
    });
  } catch (error) {
    console.error('Delete queue error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while deleting queue' });
  }
});

// Get queue statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Check if the user owns this queue
    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get token counts by status
    const tokenCounts = await Token.aggregate([
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

    // Get daily token counts for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = {
      total: 0,
      waiting: 0,
      serving: 0,
      completed: 0,
      cancelled: 0,
      avgWaitTime: avgWaitTime.length > 0 ? Math.round(avgWaitTime[0].avgWaitTime) : 0,
      dailyStats: dailyStats.map(stat => ({ date: stat._id, count: stat.count }))
    };

    // Convert aggregate results to stats object
    tokenCounts.forEach(item => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Queue stats error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while fetching queue statistics' });
  }
});

module.exports = router;