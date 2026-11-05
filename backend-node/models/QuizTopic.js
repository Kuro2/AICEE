const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },       // Nội dung câu hỏi / Tình huống
  type: { 
    type: String, 
    enum: ['scenario', 'email', 'url', 'general'], 
    default: 'scenario' 
  },
  options: {
    type: [OptionSchema],
    validate: [val => Array.isArray(val) && val.length >= 2, 'Cần tối thiểu 2 phương án lựa chọn']
  },
  explanation: { type: String, default: '' },                 // Giải thích vì sao đúng/sai
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
});

const QuizTopicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },        // Tên chủ đề (ví dụ: Nhận diện lừa đảo tuyển dụng)
  slug: {                                                      // Định danh URL (ví dụ: luadao, email, deepfake)
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  description: { type: String, default: '' },                 // Mô tả tóm tắt nội dung chủ đề
  category: { 
    type: String, 
    enum: ['scenario', 'email', 'url', 'general'], 
    default: 'scenario' 
  },
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
  questions: {
    type: [QuestionSchema],
    default: []
  },
  status: { 
    type: String, 
    enum: ['published', 'draft'], 
    default: 'published' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tự động chuẩn hóa slug trước khi lưu
QuizTopicSchema.pre('validate', function() {
  if (this.slug) {
    this.slug = this.slug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

QuizTopicSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('QuizTopic', QuizTopicSchema);
