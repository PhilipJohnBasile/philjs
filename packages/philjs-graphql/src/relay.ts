/**
 * PhilJS Relay Pagination
 */

import { signal, effect } from '@philjs/core';

export interface PageInfo { hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string; endCursor?: string; }
export interface Edge<T> { node: T; cursor: string; }
export interface Connection<T> { edges: Edge<T>[]; pageInfo: PageInfo; totalCount?: number; }

export function useRelayPagination<T>(
    query: (variables: { first?: number; after?: string; last?: number; before?: string }) => Promise<Connection<T>>,
    pageSize = 10
) {
    const data = signal<T[]>([]);
    const pageInfo = signal<PageInfo>({ hasNextPage: false, hasPreviousPage: false });
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async (variables = { first: pageSize }) => {
        loading.set(true);
        try {
            const result = await query(variables);
            data.set(result.edges.map(e => e.node));
            pageInfo.set(result.pageInfo);
        } catch (e) { error.set(e as Error); }
        finally { loading.set(false); }
    };

    fetch();

    return {
        data, pageInfo, loading, error,
        loadMore: () => pageInfo().hasNextPage && fetch({ first: pageSize, after: pageInfo().endCursor }),
        loadPrevious: () => pageInfo().hasPreviousPage && fetch({ last: pageSize, before: pageInfo().startCursor }),
        refetch: () => fetch({ first: pageSize })
    };
}
