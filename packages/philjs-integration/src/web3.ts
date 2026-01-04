
// Stub for Wagmi hooks
export function useContractRead(config: { address: string, abi: any, functionName: string }) {
    // Should integrate with viem/wagmi
    console.log('Reading contract', config.functionName);
    return { data: null, isLoading: true, error: null };
}

export function useAccount() {
    return { address: null, isConnected: false };
}
