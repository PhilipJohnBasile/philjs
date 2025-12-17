/**
 * PhilJS DevTools - Network Inspector
 */
import type { NetworkRequest } from '../types';
export declare class NetworkInspector {
    private requests;
    private selectedRequest;
    private filter;
    private typeFilter;
    update(requests: NetworkRequest[]): void;
    addRequest(request: NetworkRequest): void;
    select(requestId: string | null): void;
    setFilter(filter: string): void;
    setTypeFilter(type: string): void;
    clear(): void;
    render(): string;
    private getFilteredRequests;
    private renderRequestList;
    private renderRequestRow;
    private renderRequestDetails;
    private renderHeaders;
    private renderEmptyState;
    private getStatusClass;
    private formatUrl;
    private formatSize;
}
//# sourceMappingURL=NetworkInspector.d.ts.map