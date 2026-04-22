import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useWeb3 } from './hooks/useWeb3';
import { LayoutDashboard, PlusCircle, Wallet } from 'lucide-react';
import Home from './pages/Home';
import CreateAuction from './pages/CreateAuction';
import AuctionDetails from './pages/AuctionDetails';

function App() {
  const { address, connectWallet } = useWeb3();

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2 text-indigo-500 font-bold text-xl tracking-tight">
                <LayoutDashboard className="w-6 h-6" />
                <span>UniqueBid DApp</span>
              </Link>

              <div className="flex items-center space-x-4">
                <Link to="/create" className="hidden sm:flex items-center space-x-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Auction</span>
                </Link>

                <button
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateAuction />} />
            <Route path="/auction/:id" element={<AuctionDetails />} />
          </Routes>
        </main>

        <footer className="border-t border-zinc-800 text-zinc-500 py-8 text-center text-sm">
          <p>. UniqueBid Decentralized Auctions DApp where Highest Unique bid wins .</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
