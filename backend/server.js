require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { startIndexer } = require('./indexer');

// Routes
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ createdAt: -1 });
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auctions/:id', async (req, res) => {
  try {
    const auction = await Auction.findOne({ auctionId: req.params.id });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    
    const bids = await Bid.find({ auctionId: req.params.id });
    res.json({ ...auction.toObject(), bids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update metadata off-chain
app.post('/api/auctions/:id/metadata', async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    const auction = await Auction.findOneAndUpdate(
      { auctionId: Number(req.params.id) },
      { title, description, imageUrl },
      { new: true, upsert: true }
    );
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
  console.log(`Connected to in-memory MongoDB at ${uri}`);

  startIndexer();

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
