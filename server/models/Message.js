import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'document'],
    default: 'text',
  },
  content: {
    type: String,
    required: function() { return this.type === 'text'; } // Content is optional if it's purely a media upload, but we can treat it as caption
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
