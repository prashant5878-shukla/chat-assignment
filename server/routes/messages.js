import express from 'express';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a specific room
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check access
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ roomId })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 })
      .limit(100); // Pagination could be added here
      
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
