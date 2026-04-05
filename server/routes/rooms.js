import express from 'express';
import Room from '../models/Room.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms for logged in user (or direct messages)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('members', 'username isOnline')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new direct message room or group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, isGroup, memberIds } = req.body;
    
    // Default to at least the creator is a member
    const members = [...new Set([...memberIds, req.user._id.toString()])];

    if (!isGroup && members.length === 2) {
      // Check if a DM room already exists between these two users
      const existingRoom = await Room.findOne({
        isGroup: false,
        members: { $all: members, $size: 2 }
      });
      if (existingRoom) {
        return res.json(existingRoom);
      }
    }

    const newRoom = new Room({
      name: isGroup ? name : '',
      isGroup: isGroup || false,
      members,
      admins: isGroup ? [req.user._id] : [],
    });

    await newRoom.save();
    const populatedRoom = await Room.findById(newRoom._id).populate('members', 'username isOnline');
    res.status(201).json(populatedRoom);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
