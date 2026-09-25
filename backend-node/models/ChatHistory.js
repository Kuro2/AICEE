const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'info'
  },
  recommendations: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Cuộc trò chuyện mới'
  },
  messages: [chatMessageSchema],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

chatHistorySchema.index({ userId: 1, updatedAt: -1 });

const ChatHistoryModel = mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);

module.exports = { ChatHistoryModel };
