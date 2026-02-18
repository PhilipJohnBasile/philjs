import { signal, effect, onCleanup, type Signal } from '@philjs/core';

export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args?: any[];
  chainId?: number;
}

// Minimal ERC20 ABI for testing if none provided
const DEFAULT_ABI = ["function balanceOf(address) view returns (uint256)"];

export function useContractRead<T = any>(config: ContractConfig) {
  const data = signal<T | null>(null);
  const isLoading = signal(true);
  const error = signal<Error | null>(null);

  const fetchData = async () => {
    isLoading.set(true);
    error.set(null);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error("No Web3 Provider found");
      }

      // In a real implementation effectively use ethers/viem
      // Here we mock the RPC call using request
      const provider = (window as any).ethereum;

      // Construct call data (simplified mock)
      // Real impl would use encodeFunctionData from viem/ethers
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: config.address,
          data: '0x' // Would be encoded ABI data
        }, 'latest']
      });

      data.set(result as T);
    } catch (err: any) {
      error.set(err);
    } finally {
      isLoading.set(false);
    }
  };

  effect(() => {
    fetchData();
  });

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

export interface AccountState {
  address: Signal<`0x${string}` | undefined>;
  isConnected: Signal<boolean>;
  isConnecting: boolean;
  isDisconnected: () => boolean;
  connector: string;
}

export function useAccount(): AccountState {
  const address = signal<`0x${string}` | undefined>(undefined);
  const isConnected = signal(false);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          address.set(accounts[0]);
          isConnected.set(true);
        }
      } catch (e) {
        console.error("Web3 Check Failed", e);
      }
    }
  };

  effect(() => {
    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handler = (accounts: string[]) => {
        if (accounts.length > 0) {
          address.set(accounts[0] as `0x${string}`);
          isConnected.set(true);
        } else {
          address.set(undefined);
          isConnected.set(false);
        }
      };

      (window as any).ethereum.on('accountsChanged', handler);
      onCleanup(() => (window as any).ethereum.removeListener('accountsChanged', handler));
    }
  });

  return {
    address,
    isConnected,
    isConnecting: false, // Simplified
    isDisconnected: () => !isConnected.get(),
    connector: 'injected'
  };
}
