import { type Signal } from '@philjs/core';
export interface ContractConfig {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args?: any[];
    chainId?: number;
}
export declare function useContractRead<T = any>(config: ContractConfig): {
    data: Signal<T>;
    isLoading: Signal<boolean>;
    error: Signal<Error>;
    refetch: () => Promise<void>;
};
export interface AccountState {
    address: Signal<`0x${string}` | undefined>;
    isConnected: Signal<boolean>;
    isConnecting: boolean;
    isDisconnected: () => boolean;
    connector: string;
}
export declare function useAccount(): AccountState;
