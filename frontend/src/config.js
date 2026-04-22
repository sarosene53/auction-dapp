export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const MARKETPLACE_ABI = [
  "function createAuction(uint256 _minBid, uint256 _commitDuration, uint256 _revealDuration) external returns (uint256)",
  "function commitBid(uint256 _auctionId, bytes32 _bidHash) external payable",
  "function revealBid(uint256 _auctionId, uint256 _amount, string memory _secret) external",
  "function settleAuction(uint256 _auctionId) external",
  "event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 minBid, uint256 commitEndTime, uint256 revealEndTime)"
];
