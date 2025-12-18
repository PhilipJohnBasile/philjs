import { signal, memo } from "philjs-core";

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => any;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  const sortColumn = signal<string | null>(null);
  const sortDirection = signal<SortDirection>(null);
  const searchQuery = signal("");
  const currentPage = signal(0);
  const pageSize = 10;

  const filteredData = memo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return props.data;

    return props.data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  });

  const sortedData = memo(() => {
    const data = [...filteredData()];
    const column = sortColumn();
    const direction = sortDirection();

    if (!column || !direction) return data;

    return data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return direction === "asc" ? comparison : -comparison;
    });
  });

  const paginatedData = memo(() => {
    const start = currentPage() * pageSize;
    return sortedData().slice(start, start + pageSize);
  });

  const totalPages = memo(() => Math.ceil(sortedData().length / pageSize));

  const handleSort = (columnKey: string) => {
    if (sortColumn() === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection() === "asc") {
        sortDirection.set("desc");
      } else if (sortDirection() === "desc") {
        sortDirection.set(null);
        sortColumn.set(null);
      }
    } else {
      sortColumn.set(columnKey);
      sortDirection.set("asc");
    }
    currentPage.set(0);
  };

  const handleSearch = (e: Event) => {
    const input = e.target as HTMLInputElement;
    searchQuery.set(input.value);
    currentPage.set(0);
  };

  const handlePageChange = (page: number) => {
    currentPage.set(Math.max(0, Math.min(page, totalPages() - 1)));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn() !== columnKey) return "⇅";
    return sortDirection() === "asc" ? "↑" : "↓";
  };

  return (
    <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
      {/* Search bar */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery()}
          onInput={handleSearch}
          style={{
            width: "100%",
            padding: "0.5rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              {props.columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: column.sortable !== false ? "pointer" : "default",
                    userSelect: "none",
                  }}
                >
                  {column.label}
                  {column.sortable !== false && (
                    <span style={{ marginLeft: "0.5rem", opacity: "0.5" }}>
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData().map((row, i) => (
              <tr
                key={i}
                onClick={() => props.onRowClick?.(row)}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  cursor: props.onRowClick ? "pointer" : "default",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {props.columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: "1rem",
                      color: "#6b7280",
                    }}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages() > 1 && (
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Showing {currentPage() * pageSize + 1} to{" "}
            {Math.min((currentPage() + 1) * pageSize, sortedData().length)} of{" "}
            {sortedData().length} results
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handlePageChange(currentPage() - 1)}
              disabled={currentPage() === 0}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                cursor: currentPage() === 0 ? "not-allowed" : "pointer",
                opacity: currentPage() === 0 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {Array.from({ length: Math.min(totalPages(), 5) }, (_, i) => {
                const page = i + Math.max(0, currentPage() - 2);
                if (page >= totalPages()) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: page === currentPage() ? "#667eea" : "white",
                      color: page === currentPage() ? "white" : "#374151",
                      cursor: "pointer",
                      fontWeight: page === currentPage() ? "600" : "400",
                    }}
                  >
                    {page + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage() + 1)}
              disabled={currentPage() >= totalPages() - 1}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                cursor: currentPage() >= totalPages() - 1 ? "not-allowed" : "pointer",
                opacity: currentPage() >= totalPages() - 1 ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
