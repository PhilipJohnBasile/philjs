import { signal, effect, onCleanup } from '@philjs/core';
// Minimal ERC20 ABI for testing if none provided
const DEFAULT_ABI = ["function balanceOf(address) view returns (uint256)"];
export function useContractRead(config) {
    const data = signal(null);
    const isLoading = signal(true);
    const error = signal(null);
    const fetchData = async () => {
        isLoading.set(true);
        error.set(null);
        try {
            if (typeof window === 'undefined' || !window.ethereum) {
                throw new Error("No Web3 Provider found");
            }
            // In a real implementation effectively use ethers/viem
            // Here we mock the RPC call using request
            const provider = window.ethereum;
            // Construct call data (simplified mock)
            // Real impl would use encodeFunctionData from viem/ethers
            const result = await provider.request({
                method: 'eth_call',
                params: [{
                        to: config.address,
                        data: '0x' // Would be encoded ABI data
                    }, 'latest']
            });
            data.set(result);
        }
        catch (err) {
            error.set(err);
        }
        finally {
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
export function useAccount() {
    const address = signal(undefined);
    const isConnected = signal(false);
    const checkConnection = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    address.set(accounts[0]);
                    isConnected.set(true);
                }
            }
            catch (e) {
                console.error("Web3 Check Failed", e);
            }
        }
    };
    effect(() => {
        checkConnection();
        if (typeof window !== 'undefined' && window.ethereum) {
            const handler = (accounts) => {
                if (accounts.length > 0) {
                    address.set(accounts[0]);
                    isConnected.set(true);
                }
                else {
                    address.set(undefined);
                    isConnected.set(false);
                }
            };
            window.ethereum.on('accountsChanged', handler);
            onCleanup(() => window.ethereum.removeListener('accountsChanged', handler));
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
//# sourceMappingURL=web3.js.map