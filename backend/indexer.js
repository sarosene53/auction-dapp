const { ethers } = require('ethers');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

// Minimal ABI required for indexing
const MARKETPLACE_ABI = [
  "event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 minBid, uint256 commitEndTime, uint256 revealEndTime)",
  "event BidCommitted(uint256 indexed auctionId, address indexed bidder)",
  "event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
  "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningAmount)"
];

function startIndexer() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.warn("No CONTRACT_ADDRESS provided for indexer. Indexing disabled.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, MARKETPLACE_ABI, provider);

  console.log(`Starting indexer on contract ${contractAddress}`);

  contract.on("AuctionCreated", async (auctionId, seller, minBid, commitEndTime, revealEndTime, event) => {
    try {
      console.log(`Indexed AuctionCreated: ${auctionId}`);
      await Auction.findOneAndUpdate(
        { auctionId: Number(auctionId) },
        {
          seller,
          minBid: minBid.toString(),
          commitEndTime: Number(commitEndTime),
          revealEndTime: Number(revealEndTime)
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Error indexing AuctionCreated:", err);
    }
  });

  contract.on("BidCommitted", async (auctionId, bidder, event) => {
    try {
      console.log(`Indexed BidCommitted: ${auctionId} by ${bidder}`);
      await Bid.create({
        auctionId: Number(auctionId),
        bidder,
        status: 'committed'
      });
    } catch (err) {
      console.error("Error indexing BidCommitted:", err);
    }
  });

  contract.on("BidRevealed", async (auctionId, bidder, amount, event) => {
    try {
      console.log(`Indexed BidRevealed: ${auctionId} by ${bidder} amount ${amount}`);
      await Bid.findOneAndUpdate(
        { auctionId: Number(auctionId), bidder },
        { status: 'revealed', revealedAmount: amount.toString() },
        { new: true }
      );
    } catch (err) {
      console.error("Error indexing BidRevealed:", err);
    }
  });

  contract.on("AuctionSettled", async (auctionId, winner, winningAmount, event) => {
    try {
      console.log(`Indexed AuctionSettled: ${auctionId} winner ${winner}`);
      await Auction.findOneAndUpdate(
        { auctionId: Number(auctionId) },
        { settled: true, winner, winningAmount: winningAmount.toString() }
      );
    } catch (err) {
      console.error("Error indexing AuctionSettled:", err);
    }
  });
}

module.exports = { startIndexer };
