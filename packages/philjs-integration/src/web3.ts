import { createSignal, createEffect, onCleanup } from 'philjs';

export interface ContractConfig {
    address: \`0x\${string}\`;
    abi: any[];
    functionName: string;
    args?: any[];
    chainId?: number;
}

// Minimal ERC20 ABI for testing if none provided
const DEFAULT_ABI = ["function balanceOf(address) view returns (uint256)"];

export function useContractRead<T = any>(config: ContractConfig) {
    const [data, setData] = createSignal<T | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<Error | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
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

            setData(result as T);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        fetchData();
    });

    return {
        data,
        isLoading,
        error: error,
        refetch: fetchData
    };
}

export interface AccountState {
    address: \`0x\${string}\` | undefined;
    isConnected: boolean;
    isConnecting: boolean;
    isDisconnected: boolean;
    connector: any;
}

export function useAccount(): AccountState {
    const [address, setAddress] = createSignal<\`0x\${string}\` | undefined>(undefined);
    const [isConnected, setIsConnected] = createSignal(false);
    
    const checkConnection = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    setIsConnected(true);
                }
            } catch (e) {
                console.error("Web3 Check Failed", e);
            }
        }
    };

    createEffect(() => {
        checkConnection();
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const handler = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0] as \`0x\${string}\`);
                    setIsConnected(true);
                } else {
                    setAddress(undefined);
                    setIsConnected(false);
                }
            };

            (window as any).ethereum.on('accountsChanged', handler);
            onCleanup(() => (window as any).ethereum.removeListener('accountsChanged', handler));
        }
    });

    return {
        get address() { return address() },
        get isConnected() { return isConnected() },
        isConnecting: false, // Simplified
        get isDisconnected() { return !isConnected() },
        connector: 'injected'
    };
}
