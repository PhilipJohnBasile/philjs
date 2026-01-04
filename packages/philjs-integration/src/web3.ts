
export interface ContractConfig {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args?: any[];
    chainId?: number;
}

// Stub for Wagmi useContractRead
export function useContractRead<T = any>(config: ContractConfig) {
    // Should integrate with viem/wagmi
    // In a real implementation this would check the cache/provider
    console.log('Web3: Reading contract', { ...config });

    return {
        data: null as T | null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: () => console.log('Web3: Refetching...')
    };
}

export interface AccountState {
    address: `0x${string}` | undefined;
    isConnected: boolean;
    isConnecting: boolean;
    isDisconnected: boolean;
    connector: any;
}

// Stub for Wagmi useAccount
export function useAccount(): AccountState {
    // Mock disconnected state by default
    return {
        address: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
        connector: undefined
    };
}
