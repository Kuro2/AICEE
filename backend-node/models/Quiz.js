const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },       // Câu hỏi / Tình huống
  type: { 
    type: String, 
    enum: ['url', 'email', 'scenario', 'general'], 
    default: 'general' 
  },
  options: {
    type: [OptionSchema],
    validate: [val => Array.isArray(val) && val.length >= 2, 'Cần tối thiểu 2 lựa chọn']
  },
  explanation: { type: String, default: '' },                 // Giải thích vì sao đúng/sai & dấu hiệu nhận biết
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  sourceNewsId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'News', 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'published' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tự động cập nhật updatedAt khi sửa
QuizSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);

