// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title UniqueMarketplace
 * @dev A decentralized auction where the highest unique bid wins.
 * Includes a commit-reveal scheme to prevent bid sniping and front-running.
 */
contract UniqueMarketplace {
    struct Auction {
        address seller;
        uint256 minBid;
        uint256 commitEndTime;
        uint256 revealEndTime;
        bool settled;
        address highestUniqueBidder;
        uint256 highestUniqueBid;
    }

    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;

    // auctionId => bidder => bidHash
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    // auctionId => bidder => deposited amount (ETH sent with commit)
    mapping(uint256 => mapping(address => uint256)) public deposits;
    // auctionId => bidder => revealed bid amount
    mapping(uint256 => mapping(address => uint256)) public revealedBids;

    // auctionId => list of address who have successfully revealed
    mapping(uint256 => address[]) public auctionRevealedBidders;
    // auctionId => bid amount => count of how many people bid this amount
    mapping(uint256 => mapping(uint256 => uint256)) public bidCounts;
    
    // auctionId => bidder => bool
    mapping(uint256 => mapping(address => bool)) public hasRevealed;

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 minBid, uint256 commitEndTime, uint256 revealEndTime);
    event BidCommitted(uint256 indexed auctionId, address indexed bidder);
    event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningAmount);

    modifier onlyBeforeCommitEnd(uint256 _auctionId) {
        require(block.timestamp <= auctions[_auctionId].commitEndTime, "Commit phase has ended");
        _;
    }

    modifier onlyDuringReveal(uint256 _auctionId) {
        require(block.timestamp > auctions[_auctionId].commitEndTime, "Commit phase not ended");
        require(block.timestamp <= auctions[_auctionId].revealEndTime, "Reveal phase has ended");
        _;
    }

    modifier onlyAfterRevealEnd(uint256 _auctionId) {
        require(block.timestamp > auctions[_auctionId].revealEndTime, "Reveal phase not ended");
        _;
    }

    function createAuction(uint256 _minBid, uint256 _commitDuration, uint256 _revealDuration) external returns (uint256) {
        auctionCount++;
        uint256 cEnd = block.timestamp + _commitDuration;
        uint256 rEnd = cEnd + _revealDuration;

        auctions[auctionCount] = Auction({
            seller: msg.sender,
            minBid: _minBid,
            commitEndTime: cEnd,
            revealEndTime: rEnd,
            settled: false,
            highestUniqueBidder: address(0),
            highestUniqueBid: 0
        });

        emit AuctionCreated(auctionCount, msg.sender, _minBid, cEnd, rEnd);
        return auctionCount;
    }

    function commitBid(uint256 _auctionId, bytes32 _bidHash) external payable onlyBeforeCommitEnd(_auctionId) {
        require(msg.value > 0, "Deposit required");
        require(commitments[_auctionId][msg.sender] == bytes32(0), "Already committed");

        commitments[_auctionId][msg.sender] = _bidHash;
        deposits[_auctionId][msg.sender] = msg.value;

        emit BidCommitted(_auctionId, msg.sender);
    }

    function revealBid(uint256 _auctionId, uint256 _amount, string memory _secret) external onlyDuringReveal(_auctionId) {
        require(!hasRevealed[_auctionId][msg.sender], "Already revealed");
        bytes32 committedHash = commitments[_auctionId][msg.sender];
        require(committedHash != bytes32(0), "No commitment found");

        bytes32 verificationHash = keccak256(abi.encodePacked(_amount, _secret));
        require(committedHash == verificationHash, "Invalid reveal secret or amount");

        require(_amount >= auctions[_auctionId].minBid, "Bid below minimum");
        require(_amount <= deposits[_auctionId][msg.sender], "Bid exceeds deposit");

        hasRevealed[_auctionId][msg.sender] = true;
        revealedBids[_auctionId][msg.sender] = _amount;
        bidCounts[_auctionId][_amount] += 1;
        auctionRevealedBidders[_auctionId].push(msg.sender);

        emit BidRevealed(_auctionId, msg.sender, _amount);
    }

    function settleAuction(uint256 _auctionId) external onlyAfterRevealEnd(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(!auction.settled, "Auction already settled");

        auction.settled = true;

        address[] memory bidders = auctionRevealedBidders[_auctionId];
        uint256 maxUniqueBid = 0;
        address winner = address(0);

        // Find the highest unique bid
        for (uint256 i = 0; i < bidders.length; i++) {
            address bidder = bidders[i];
            uint256 bidAmount = revealedBids[_auctionId][bidder];

            if (bidCounts[_auctionId][bidAmount] == 1) {
                if (bidAmount > maxUniqueBid) {
                    maxUniqueBid = bidAmount;
                    winner = bidder;
                }
            }
        }

        auction.highestUniqueBid = maxUniqueBid;
        auction.highestUniqueBidder = winner;

        // Route funds securely
        for (uint256 i = 0; i < bidders.length; i++) {
            address bidder = bidders[i];
            uint256 dep = deposits[_auctionId][bidder];
            // To protect against re-entrancy we clear deposit balances
            deposits[_auctionId][bidder] = 0;

            if (bidder == winner) {
                // Winner pays the bid amount
                uint256 refund = dep - maxUniqueBid; // Dep is guaranteed >= maxUniqueBid from reveal check
                if (refund > 0) {
                    (bool rb, ) = payable(bidder).call{value: refund}("");
                    require(rb, "Refund failed");
                }
            } else {
                // Loser gets full refund
                (bool rb, ) = payable(bidder).call{value: dep}("");
                require(rb, "Refund failed");
            }
        }

        // Send funds to seller if there is a winner
        if (winner != address(0)) {
            (bool sb, ) = payable(auction.seller).call{value: maxUniqueBid}("");
            require(sb, "Seller transfer failed");
        }

        emit AuctionSettled(_auctionId, winner, maxUniqueBid);
    }
}
