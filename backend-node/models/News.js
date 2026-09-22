const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('vi-VN') },
  category: { type: String, required: true },
  image: { type: String, required: true },
  author: { type: String, default: 'AICEE Security Team' },
  views: { type: Number, default: 0 },
  tags: [{ type: String }]
}, {
  timestamps: true
});

// Chuyển _id thành id cho frontend
newsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

const NewsModel = mongoose.models.News || mongoose.model('News', newsSchema);
module.exports = NewsModel;
