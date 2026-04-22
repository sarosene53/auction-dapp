import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag } from 'lucide-react';
import { ethers } from 'ethers';

export default function Home() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/auctions')
      .then(res => res.json())
      .then(data => {
        setAuctions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch auctions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 animate-pulse text-zinc-400">Loading active auctions...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Live Auctions</h1>
        <p className="text-zinc-400 mt-2">Discover and securely bid on unique assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => {
          const commitTimeMs = auction.commitEndTime * 1000;
          const revealTimeMs = auction.revealEndTime * 1000;
          const isCommitting = Date.now() < commitTimeMs;
          const isRevealing = !isCommitting && Date.now() < revealTimeMs;
          const statusColors = isCommitting ? 'text-emerald-400 bg-emerald-400/10' :
            isRevealing ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 bg-zinc-800';

          return (
            <Link
              to={`/auction/${auction.auctionId}`}
              key={auction.auctionId}
              className="block group rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.15)]"
            >
              <div className="h-48 bg-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {auction.imageUrl ? (
                  <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                ) : (
                  <Tag className="w-12 h-12 text-zinc-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors">
                    {auction.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors}`}>
                    {isCommitting ? 'Commit Phase' : isRevealing ? 'Reveal Phase' : 'Ended'}
                  </span>
                </div>

                <p className="text-zinc-500 text-sm mb-6 line-clamp-2">
                  {auction.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-zinc-500">Min Bid</span>
                    <span className="font-semibold text-white">
                      {auction.minBid ? ethers.formatEther(auction.minBid.toString()) : '0'} ETH
                    </span>
                  </div>

                  <div className="flex items-center text-zinc-400 space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {isCommitting ? 'Commit Phase' : isRevealing ? 'Revealing...' : 'Finished'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
