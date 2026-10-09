const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'business', 'api', 'platform-api'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  paymentGateway: {
    type: String,
    default: 'SePay - TPBank'
  },
  accountNumber: {
    type: String,
    default: '10005920328'
  },
  transactionId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  sepayTransaction: {
    type: Object,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
