const mongoose = require('mongoose');

const fileAttachmentSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  size: { type: Number, default: 0 },
  preview: { type: String, default: '' }
}, { _id: false, strict: false });

const chatMessageSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null, 
    index: true 
  },
  sessionId: { 
    type: String, 
    required: true, 
    index: true 
  },
  type: { 
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
  files: [fileAttachmentSchema],
  newDataCheck: {
    isNewData: { type: Boolean, default: false },
    target: { type: String, default: '' },
    type: { type: String, default: '' },
    suggestRequest: { type: Boolean, default: false }
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
}, {
  timestamps: true
});

// Xóa model cũ khỏi cache Mongoose nếu có để áp dụng schema mới
if (mongoose.models && mongoose.models.ChatMessage) {
  delete mongoose.models.ChatMessage;
}

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

