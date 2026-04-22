const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auctionId: { type: Number, required: true },
  bidder: { type: String, required: true },
  status: { type: String, enum: ['committed', 'revealed'], default: 'committed' },
  revealedAmount: { type: String, default: null } // Stored in string to handle large values securely
}, { timestamps: true });

// Ensure a user only has one bid record per auction
bidSchema.index({ auctionId: 1, bidder: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
