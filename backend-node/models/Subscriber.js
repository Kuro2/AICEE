const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true }
}, {
  timestamps: true
});

const SubscriberModel = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
module.exports = SubscriberModel;
