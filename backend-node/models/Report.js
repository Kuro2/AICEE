const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  target: {
    type: String,
    required: [true, 'Địa chỉ/Số điện thoại/Website cần báo cáo là bắt buộc'],
    trim: true,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Thể loại báo cáo là bắt buộc'],
    enum: ['Website', 'Email', 'SĐT', 'Tổ chức', 'Tổ chức giả mạo', 'Khác'],
    default: 'Website'
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Nội dung chi tiết lừa đảo là bắt buộc'],
    trim: true
  },
  evidenceFiles: [{
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    url: { type: String, default: '' }
  }],
  reporterName: {
    type: String,
    default: 'Ẩn danh'
  },
  reporterEmail: {
    type: String,
    default: ''
  },
  reporterPhone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNote: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
