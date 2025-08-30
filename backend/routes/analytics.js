const express = require('express');
const Token = require('../models/Token');
const Queue = require('../models/Queue');
const auth = require('../middleware/auth');

const router = express.Router();

// Get analytics for a specific queue
router.get('/queue/:queueId', auth, async (req, res) => {
  try {
    const { queueId } = req.params;
    const { period = '7d' } = req.query; // 7d, 30d, 90d

    // Verify queue exists and user owns it
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default: // 7 days
        startDate.setDate(now.getDate() - 7);
    }

    // Get token statistics
    const tokenStats = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { 
            $avg: { 
              $cond: [{ $gt: ['$waitTime', 0] }, '$waitTime', null] 
            } 
          }
        }
      }
    ]);

    // Get daily token counts
    const dailyStats = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgWaitTime: {
            $avg: {
              $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $gt: ['$waitTime', 0] }] }, '$waitTime', null]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get hourly distribution for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hourlyStats = await Token.aggregate([
      {
        $match: {
          queue: queue._id,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: {
            $hour: '$createdAt'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall statistics
    const totalTokens = await Token.countDocuments({ queue: queue._id });
    const completedTokens = await Token.countDocuments({ 
      queue: queue._id, 
      status: 'completed' 
    });
    
    const avgWaitTimeAll = await Token.aggregate([
      { 
        $match: { 
          queue: queue._id, 
          status: 'completed',
          waitTime: { $gt: 0 }
        } 
      },
      { $group: { _id: null, avgWaitTime: { $avg: '$waitTime' } } }
    ]);

    const maxWaitTime = await Token.findOne(
      { queue: queue._id, status: 'completed', waitTime: { $gt: 0 } },
      { waitTime: 1 }
    ).sort({ waitTime: -1 });

    const minWaitTime = await Token.findOne(
      { queue: queue._id, status: 'completed', waitTime: { $gt: 0 } },
      { waitTime: 1 }
    ).sort({ waitTime: 1 });

    const analytics = {
      queue: {
        id: queue._id,
        name: queue.name,
        createdAt: queue.createdAt
      },
      period: {
        start: startDate,
        end: now,
        days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalTokens,
        completedTokens,
        completionRate: totalTokens > 0 ? (completedTokens / totalTokens * 100).toFixed(1) : 0,
        avgWaitTime: avgWaitTimeAll.length > 0 ? Math.round(avgWaitTimeAll[0].avgWaitTime) : 0,
        maxWaitTime: maxWaitTime ? maxWaitTime.waitTime : 0,
        minWaitTime: minWaitTime ? minWaitTime.waitTime : 0
      },
      statusDistribution: tokenStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      dailyStats: dailyStats.map(stat => ({
        date: stat._id,
        total: stat.count,
        completed: stat.completed,
        avgWaitTime: Math.round(stat.avgWaitTime || 0)
      })),
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => {
        const hourData = hourlyStats.find(h => h._id === i);
        return {
          hour: i,
          count: hourData ? hourData.count : 0
        };
      }),
      trends: {
        dailyAvg: dailyStats.length > 0 
          ? (dailyStats.reduce((sum, day) => sum + day.count, 0) / dailyStats.length).toFixed(1)
          : 0,
        peakDay: dailyStats.length > 0
          ? dailyStats.reduce((max, day) => day.count > max.count ? day : max, dailyStats[0])
          : null,
        busiestHour: hourlyStats.length > 0
          ? hourlyStats.reduce((max, hour) => hour.count > max.count ? hour : max, hourlyStats[0])
          : null
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid queue ID' });
    }
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
});

// Get overall user analytics
router.get('/overview', auth, async (req, res) => {
  try {
    // Get user's queues
    const queues = await Queue.find({ createdBy: req.user.id });

    // Get overall statistics
    const queueStats = await Promise.all(
      queues.map(async (queue) => {
        const tokenCount = await Token.countDocuments({ queue: queue._id });
        const completedCount = await Token.countDocuments({ 
          queue: queue._id, 
          status: 'completed' 
        });
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

        return {
          queueId: queue._id,
          queueName: queue.name,
          totalTokens: tokenCount,
          completedTokens: completedCount,
          completionRate: tokenCount > 0 ? (completedCount / tokenCount * 100).toFixed(1) : 0,
          avgWaitTime: avgWaitTime.length > 0 ? Math.round(avgWaitTime[0].avgWaitTime) : 0
        };
      })
    );

    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTokens = await Token.countDocuments({
      queue: { $in: queues.map(q => q._id) },
      createdAt: { $gte: today }
    });

    const overview = {
      totalQueues: queues.length,
      activeQueues: queues.filter(q => q.isActive).length,
      totalTokens: queueStats.reduce((sum, stat) => sum + stat.totalTokens, 0),
      todaysTokens,
      queueStats,
      mostActiveQueue: queueStats.length > 0
        ? queueStats.reduce((max, stat) => stat.totalTokens > max.totalTokens ? stat : max, queueStats[0])
        : null,
      mostEfficientQueue: queueStats.length > 0
        ? queueStats.reduce((max, stat) => stat.completionRate > max.completionRate ? stat : max, queueStats[0])
        : null
    };

    res.json(overview);
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching overview analytics' });
  }
});

module.exports = router;