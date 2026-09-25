const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/resources
 * @desc    Lấy danh sách tài nguyên (an toàn/không an toàn)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { isSafe } = req.query;
    let query = {};
    
    if (isSafe !== undefined) {
      query.isSafe = isSafe === 'true';
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Lỗi khi lấy tài nguyên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

/**
 * @route   POST /api/resources
 * @desc    Thêm tài nguyên mới
 * @access  Private/Admin
 */
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { isSafe, type, name, address, description } = req.body;
    if (!type || !address) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập loại và địa chỉ' });
    }
    
    const newResource = new Resource({
      isSafe: isSafe === true || isSafe === 'true',
      type,
      name: name || '',
      address,
      description: description || ''
    });
    
    await newResource.save();
    res.json({ success: true, message: 'Đã thêm tài nguyên', data: newResource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm tài nguyên' });
  }
});

/**
 * @route   PUT /api/resources/:id
 * @desc    Cập nhật tài nguyên
 * @access  Private/Admin
 */
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài nguyên' });
    }
    res.json({ success: true, message: 'Đã cập nhật tài nguyên', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật tài nguyên' });
  }
});

/**
 * @route   DELETE /api/resources/:id
 * @desc    Xóa tài nguyên
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const deleted = await Resource.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài nguyên' });
    }
    res.json({ success: true, message: 'Đã xóa tài nguyên' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tài nguyên' });
  }
});

module.exports = router;
