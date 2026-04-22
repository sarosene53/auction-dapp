const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  auctionId: { type: Number, required: true, unique: true },
  seller: { type: String, default: '' },
  minBid: { type: String, default: '0' },
  commitEndTime: { type: Number, default: 0 },
  revealEndTime: { type: Number, default: 0 },
  settled: { type: Boolean, default: false },
  winner: { type: String, default: null },
  winningAmount: { type: String, default: null },
  metadataUrl: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);
