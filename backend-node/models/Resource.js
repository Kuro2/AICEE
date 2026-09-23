const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  isSafe: { type: Boolean, required: true },
  type: { type: String, required: true }, // 'Website', 'Email', 'SĐT', 'Tổ chức' (or just general type)
  name: { type: String, default: '' }, // Tên tổ chức (đối với danh sách an toàn)
  address: { type: String, required: true }, // URL, email, hoặc số điện thoại
  description: { type: String, required: true } // Lĩnh vực (safe) hoặc Lý do (unsafe)
}, {
  timestamps: true
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
