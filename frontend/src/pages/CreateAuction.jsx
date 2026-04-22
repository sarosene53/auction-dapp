import React, { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, MARKETPLACE_ABI } from '../config';

export default function CreateAuction() {
  const { provider, signer } = useWeb3();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    minBid: '0.1',
    commitDays: '1',
    revealDays: '1'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signer) return alert("Please connect wallet first.");
    if (!CONTRACT_ADDRESS) return alert("Missing CONTRACT_ADDRESS. Set it in frontend/.env!");
    
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
      
      const minBidWei = ethers.parseEther(formData.minBid);
      const commitSecs = parseInt(formData.commitDays) * 86400;
      const revealSecs = parseInt(formData.revealDays) * 86400;

      const tx = await contract.createAuction(minBidWei, commitSecs, revealSecs);
      const receipt = await tx.wait();
      
      let auctionId;
      for (const log of receipt.logs) {
        try {
           const parsedLog = contract.interface.parseLog(log);
           if (parsedLog.name === 'AuctionCreated') {
             auctionId = parsedLog.args[0].toString();
           }
        } catch (e) {}
      }

      if (auctionId) {
        // Wait briefly for backend indexer to pick up the blockchain event
        await new Promise(r => setTimeout(r, 2000));
        
        await fetch(`http://localhost:3001/api/auctions/${auctionId}/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            imageUrl: formData.imageUrl
          })
        });
      }

      alert("Auction created successfully and indexed!");
      setFormData({ title: '', description: '', imageUrl: '', minBid: '0.1', commitDays: '1', revealDays: '1' });
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Auction</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Item Title</label>
            <input 
              type="text" name="title" required
              value={formData.title} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="E.g. Rare Abstract NFT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Image URL</label>
            <input 
              type="url" name="imageUrl" required
              value={formData.imageUrl} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea 
              name="description" rows={4} required
              value={formData.description} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Describe the asset..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Min Bid (ETH)</label>
              <input 
                type="number" step="0.01" name="minBid" required
                value={formData.minBid} onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Commit Phase (Days)</label>
              <input 
                type="number" min="1" name="commitDays" required
                value={formData.commitDays} onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Reveal Phase (Days)</label>
              <input 
                type="number" min="1" name="revealDays" required
                value={formData.revealDays} onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Auction'}
          </button>
        </form>
      </div>
    </div>
  );
}
