import { useWeb3Context } from '../contexts/Web3Context';

// Helper custom hook for ethers
export function useWeb3() {
  return useWeb3Context();
}
