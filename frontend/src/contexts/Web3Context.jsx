import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    // Set up provider and account change listener
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const setupProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(setupProvider);
          const currentSigner = await setupProvider.getSigner();
          setSigner(currentSigner);
        } else {
          setAddress(null);
          setSigner(null);
        }
      });
      
      const setupProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(setupProvider);
      
      // Auto-connect if already authorized
      window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const currentSigner = await setupProvider.getSigner();
          setSigner(currentSigner);
        }
      }).catch(console.error);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application.");
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const setupProvider = new ethers.BrowserProvider(window.ethereum);
      const currentSigner = await setupProvider.getSigner();
      setProvider(setupProvider);
      setAddress(accounts[0]);
      setSigner(currentSigner);
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  return (
    <Web3Context.Provider value={{ address, provider, signer, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3Context() {
  return useContext(Web3Context);
}
