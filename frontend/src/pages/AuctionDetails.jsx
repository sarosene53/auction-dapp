import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { Shield, LockOpen, CheckCircle, Info, Tag } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, MARKETPLACE_ABI } from '../config';

export default function AuctionDetails() {
  const { id } = useParams();
  const { address, signer } = useWeb3();
  const [activeTab, setActiveTab] = useState('commit');
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for commit
  const [commitBid, setCommitBid] = useState('');
  const [commitDeposit, setCommitDeposit] = useState('');
  const [commitSecret, setCommitSecret] = useState('');
  
  // States for reveal
  const [revealBid, setRevealBid] = useState('');
  const [revealSecret, setRevealSecret] = useState('');

  useEffect(() => {
    fetch(`http://localhost:3001/api/auctions/${id}`)
      .then(res => res.json())
      .then(data => {
        setAuction(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Connect wallet first!");
    if (!CONTRACT_ADDRESS) return alert("Missing CONTRACT_ADDRESS in frontend/.env!");
    if (parseFloat(commitDeposit) < parseFloat(commitBid)) return alert("Deposit must be >= bid amount");
    
    try {
      const bidAmountWei = ethers.parseEther(commitBid);
      const depositWei = ethers.parseEther(commitDeposit);
      
      const hash = ethers.solidityPackedKeccak256(["uint256", "string"], [bidAmountWei, commitSecret]);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
      
      console.log(`Submitting commit. Secret: ${commitSecret}, Hash: ${hash}`);
      const tx = await contract.commitBid(id, hash, { value: depositWei });
      await tx.wait();
      
      alert(`Successfully committed!\nYour secret hash is: ${hash}\nPlease save your password: "${commitSecret}"! You NEED it to reveal.`);
    } catch (err) {
      console.error(err);
      alert("Error committing: " + err.message);
      if (err.message.includes("Nonce")) alert("MetaMask Nonce issue! Go to MetaMask -> Settings -> Advanced -> Clear activity tab data.");
    }
  };

  const handleReveal = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Connect wallet first!");
    if (!CONTRACT_ADDRESS) return alert("Missing CONTRACT_ADDRESS in frontend/.env!");
    
    try {
      const bidAmountWei = ethers.parseEther(revealBid);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
      
      const tx = await contract.revealBid(id, bidAmountWei, revealSecret);
      await tx.wait();
      
      alert(`Successfully revealed bid ${revealBid} ETH!`);
    } catch (err) {
      console.error(err);
      alert("Error revealing: " + err.message);
      if (err.message.includes("Nonce")) alert("MetaMask Nonce issue! Go to MetaMask -> Settings -> Advanced -> Clear activity tab data.");
      else if (err.message.includes("revert")) alert("Transaction reverted. Make sure the commit phase has ended and your secret is perfectly accurate.");
    }
  };

  if (loading) return <div className="text-center py-20 text-zinc-400">Loading auction details...</div>;
  if (!auction) return <div className="text-center py-20 text-zinc-400">Auction not found!</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left side: Auction details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-fit">
        <div className="flex items-center space-x-2 text-indigo-400 mb-4">
          <Info className="w-5 h-5" />
          <span className="font-semibold uppercase tracking-wider text-sm">Auction #{id}</span>
        </div>
        
        {auction.imageUrl ? (
          <div className="w-full h-64 bg-zinc-800 rounded-xl overflow-hidden mb-6">
            <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-64 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
            <Tag className="w-16 h-16 text-zinc-700" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-4">{auction.title || `Auction #${id}`}</h1>
        <p className="text-zinc-400 mb-6 leading-relaxed">
          {auction.description || "No description provided."}
        </p>

        <div className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 p-4 rounded-xl flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Commit Phase Active</h4>
            <p className="text-sm mt-1 opacity-90">Hash your bid securely. Send a deposit greater than or equal to your bid to obfuscate your intent.</p>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex bg-zinc-950 p-1 rounded-xl mb-8">
          <button 
            onClick={() => setActiveTab('commit')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${activeTab === 'commit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Shield className="w-4 h-4" />
            <span>1. Commit Bid</span>
          </button>
          <button 
            onClick={() => setActiveTab('reveal')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${activeTab === 'reveal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <LockOpen className="w-4 h-4" />
            <span>2. Reveal Bid</span>
          </button>
        </div>

        {activeTab === 'commit' && (
          <form onSubmit={handleCommit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Secret String (Password)</label>
              <input 
                type="text" required value={commitSecret} onChange={(e) => setCommitSecret(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. MySuperSecret123"
              />
              <p className="text-xs text-amber-500 mt-2">DO NOT FORGET THIS. You need it to reveal your bid!</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Actual Bid (ETH)</label>
                <input 
                  type="number" step="0.01" required value={commitBid} onChange={(e) => setCommitBid(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Deposit (ETH)</label>
                <input 
                  type="number" step="0.01" required value={commitDeposit} onChange={(e) => setCommitDeposit(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="3.0"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg">
              Commit Securely
            </button>
          </form>
        )}

        {activeTab === 'reveal' && (
          <form onSubmit={handleReveal} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Your Secret String</label>
              <input 
                type="text" required value={revealSecret} onChange={(e) => setRevealSecret(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="MySuperSecret123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bid Amount (ETH)</label>
              <input 
                type="number" step="0.01" required value={revealBid} onChange={(e) => setRevealBid(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2.5"
              />
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg">
              Reveal Bid
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
