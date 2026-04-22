import { expect } from "chai";
import hre from "hardhat";

describe("UniqueMarketplace", function () {
    let marketplace;
    let owner;
    let seller;
    let buyer1;
    let buyer2;
    let buyer3;

    beforeEach(async function () {
        [owner, seller, buyer1, buyer2, buyer3] = await hre.ethers.getSigners();
        const Marketplace = await hre.ethers.getContractFactory("UniqueMarketplace");
        marketplace = await Marketplace.deploy();
    });

    it("Should create an auction, allow commits, reveals and correctly determine the highest unique winner", async function () {
        // Create an auction
        const commitDuration = 60; // 60 seconds
        const revealDuration = 60; // 60 seconds
        const minBid = hre.ethers.parseEther("0.1");

        await marketplace.connect(seller).createAuction(minBid, commitDuration, revealDuration);

        // Buyer 1 bids 1 ETH (will be highest unique)
        const bid1Amount = hre.ethers.parseEther("1.0");
        const bid1Secret = "secret1";
        const bid1Hash = hre.ethers.solidityPackedKeccak256(["uint256", "string"], [bid1Amount, bid1Secret]);

        // Buyer 2 bids 2 ETH (will be duplicate)
        const bid2Amount = hre.ethers.parseEther("2.0");
        const bid2Secret = "secret2";
        const bid2Hash = hre.ethers.solidityPackedKeccak256(["uint256", "string"], [bid2Amount, bid2Secret]);

        // Buyer 3 bids 2 ETH (will be duplicate)
        const bid3Amount = hre.ethers.parseEther("2.0");
        const bid3Secret = "secret3";
        const bid3Hash = hre.ethers.solidityPackedKeccak256(["uint256", "string"], [bid3Amount, bid3Secret]);

        // Buyers commit (sending extra ETH to hide actual bid)
        await marketplace.connect(buyer1).commitBid(1, bid1Hash, { value: hre.ethers.parseEther("1.5") });
        await marketplace.connect(buyer2).commitBid(1, bid2Hash, { value: hre.ethers.parseEther("2.5") });
        await marketplace.connect(buyer3).commitBid(1, bid3Hash, { value: hre.ethers.parseEther("3.0") });

        // Let's forward time to reveal phase
        await hre.ethers.provider.send("evm_increaseTime", [61]);
        await hre.ethers.provider.send("evm_mine");

        // Buyers reveal
        await marketplace.connect(buyer1).revealBid(1, bid1Amount, bid1Secret);
        await marketplace.connect(buyer2).revealBid(1, bid2Amount, bid2Secret);
        await marketplace.connect(buyer3).revealBid(1, bid3Amount, bid3Secret);

        // Forward time to settlement phase
        await hre.ethers.provider.send("evm_increaseTime", [61]);
        await hre.ethers.provider.send("evm_mine");

        // Record balances
        const sellerBalanceBefore = await hre.ethers.provider.getBalance(seller.address);

        // Settle auction
        await marketplace.settleAuction(1);

        const auction = await marketplace.auctions(1);
        expect(auction.settled).to.be.true;
        expect(auction.highestUniqueBidder).to.equal(buyer1.address);
        expect(auction.highestUniqueBid).to.equal(bid1Amount);

        // Check seller got the money
        const sellerBalanceAfter = await hre.ethers.provider.getBalance(seller.address);
        expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(bid1Amount);
    });
});
