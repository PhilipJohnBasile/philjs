/**
 * InvoiceList Component
 *
 * Displays invoice history with filtering, pagination,
 * and download capabilities.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Invoice, Money } from '../index';

export interface InvoiceListProps {
  /** List of invoices to display */
  invoices: Invoice[];
  /** Callback to load more invoices */
  onLoadMore?: () => Promise<void>;
  /** Whether there are more invoices to load */
  hasMore?: boolean;
  /** Callback when an invoice is clicked */
  onInvoiceClick?: (invoice: Invoice) => void;
  /** Callback to retry a failed payment */
  onRetryPayment?: (invoiceId: string) => Promise<void>;
  /** Custom class names */
  className?: string;
  /** Whether loading is in progress */
  isLoading?: boolean;
  /** Number of invoices per page (for client-side pagination) */
  pageSize?: number;
  /** Whether to show search/filter controls */
  showFilters?: boolean;
  /** Custom empty state content */
  emptyState?: React.ReactNode;
}

type StatusFilter = 'all' | Invoice['status'];
type SortField = 'date' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

/**
 * Invoice List Component
 *
 * Displays a list of invoices with sorting, filtering, and pagination.
 */
export function InvoiceList({
  invoices,
  onLoadMore,
  hasMore = false,
  onInvoiceClick,
  onRetryPayment,
  className = '',
  isLoading = false,
  pageSize = 10,
  showFilters = true,
  emptyState,
}: InvoiceListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const formatMoney = useCallback((money: Money) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency.toUpperCase(),
    }).format(money.amount / 100);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.id.toLowerCase().includes(query) ||
          formatMoney(inv.amount).toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'amount':
          comparison = a.amount.amount - b.amount.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, statusFilter, searchQuery, sortField, sortDirection, formatMoney]);

  // Paginate
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRetryPayment = async (invoiceId: string) => {
    if (!onRetryPayment || retryingId) return;

    setRetryingId(invoiceId);
    try {
      await onRetryPayment(invoiceId);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    const colors: Record<Invoice['status'], string> = {
      draft: 'gray',
      open: 'blue',
      paid: 'green',
      void: 'gray',
      uncollectible: 'red',
    };
    return colors[status];
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (invoices.length === 0 && !isLoading) {
    return (
      <div className={`invoice-list invoice-list--empty ${className}`}>
        {emptyState || (
          <div className="invoice-list__empty-state">
            <div className="invoice-list__empty-icon">📄</div>
            <h3 className="invoice-list__empty-title">No Invoices Yet</h3>
            <p className="invoice-list__empty-description">
              Your invoices will appear here once you make a purchase or have an active subscription.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`invoice-list ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="invoice-list__filters">
          <div className="invoice-list__search">
            <input
              type="text"
              className="invoice-list__search-input"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search invoices"
            />
          </div>

          <div className="invoice-list__status-filter">
            <select
              className="invoice-list__status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
              <option value="uncollectible">Uncollectible</option>
            </select>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="invoice-list__summary">
        <span className="invoice-list__count">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
        </span>
        {filteredInvoices.length > 0 && (
          <span className="invoice-list__total">
            Total:{' '}
            {formatMoney({
              amount: filteredInvoices.reduce((sum, inv) => sum + inv.amount.amount, 0),
              currency: filteredInvoices[0]?.amount.currency || 'usd',
            })}
          </span>
        )}
      </div>

      {/* Invoice Table */}
      <div className="invoice-list__table-container">
        <table className="invoice-list__table">
          <thead>
            <tr>
              <th
                className="invoice-list__th invoice-list__th--sortable"
                onClick={() => handleSort('date')}
              >
                Date {getSortIcon('date')}
              </th>
              <th className="invoice-list__th">Invoice #</th>
              <th
                className="invoice-list__th invoice-list__th--sortable"
                onClick={() => handleSort('amount')}
              >
                Amount {getSortIcon('amount')}
              </th>
              <th
                className="invoice-list__th invoice-list__th--sortable"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
              <th className="invoice-list__th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="invoice-list__loading">
                  Loading invoices...
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="invoice-list__row"
                  onClick={() => onInvoiceClick?.(invoice)}
                >
                  <td className="invoice-list__td">{formatDate(invoice.createdAt)}</td>
                  <td className="invoice-list__td invoice-list__td--id">
                    <span className="invoice-list__invoice-id">{invoice.id}</span>
                    {invoice.subscriptionId && (
                      <span className="invoice-list__subscription-badge">Subscription</span>
                    )}
                  </td>
                  <td className="invoice-list__td invoice-list__td--amount">
                    {formatMoney(invoice.amount)}
                    {invoice.amountDue.amount > 0 &&
                      invoice.status === 'open' && (
                        <span className="invoice-list__due">
                          Due: {formatMoney(invoice.amountDue)}
                        </span>
                      )}
                  </td>
                  <td className="invoice-list__td">
                    <span
                      className={`invoice-list__status invoice-list__status--${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td
                    className="invoice-list__td invoice-list__td--actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {invoice.invoicePdf && (
                      <a
                        href={invoice.invoicePdf}
                        className="invoice-list__action"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download PDF"
                      >
                        ⬇ PDF
                      </a>
                    )}
                    {invoice.hostedInvoiceUrl && (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        className="invoice-list__action"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Invoice"
                      >
                        👁 View
                      </a>
                    )}
                    {(invoice.status === 'open' || invoice.status === 'uncollectible') &&
                      onRetryPayment && (
                        <button
                          className="invoice-list__action invoice-list__action--retry"
                          onClick={() => handleRetryPayment(invoice.id)}
                          disabled={retryingId === invoice.id}
                        >
                          {retryingId === invoice.id ? '...' : '🔄 Retry'}
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="invoice-list__pagination">
          <button
            className="invoice-list__page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <span className="invoice-list__page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="invoice-list__page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}

      {/* Load More (for server-side pagination) */}
      {hasMore && onLoadMore && (
        <div className="invoice-list__load-more">
          <button
            className="invoice-list__load-more-btn"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Invoices'}
          </button>
        </div>
      )}

      {/* Export Options */}
      {invoices.length > 0 && (
        <div className="invoice-list__export">
          <button
            className="invoice-list__export-btn"
            onClick={() => {
              // Generate CSV export
              const headers = ['Date', 'Invoice ID', 'Amount', 'Status', 'Paid At'];
              const rows = filteredInvoices.map((inv) => [
                formatDate(inv.createdAt),
                inv.id,
                formatMoney(inv.amount),
                inv.status,
                inv.paidAt ? formatDate(inv.paidAt) : '',
              ]);
              const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'invoices.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
