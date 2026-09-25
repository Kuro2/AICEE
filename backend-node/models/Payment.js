const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  planType: {
    type: String,
    enum: ['premium_monthly', 'premium_yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  provider: {
    type: String,
    enum: ['vnpay', 'mock', 'momo'],
    default: 'vnpay'
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentUrl: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = { PaymentModel };
