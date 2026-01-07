import { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => ReactNode;
}

interface DataGridProps<T = any> {
  columns: Column<T>[];
  data: T[];
  density?: 'comfortable' | 'compact';
  hasSelection?: boolean;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  density = 'comfortable',
  hasSelection = false,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  emptyMessage = 'Keine Daten verfügbar'
}: DataGridProps<T>) {
  const rowHeight = density === 'compact' ? 'var(--height-table-row-compact)' : 'var(--height-table-row)';
  const headerHeight = density === 'compact' ? 'var(--height-table-header-compact)' : 'var(--height-table-header)';
  
  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center border rounded-lg p-12"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-alt)'
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr 
              style={{ 
                backgroundColor: 'var(--surface-surface)',
                height: headerHeight,
                borderBottom: '1px solid var(--border-default)'
              }}
            >
              {hasSelection && (
                <th style={{ width: '48px', padding: '0 var(--space-4)' }}>
                  <input type="checkbox" />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align || 'left',
                    padding: '0 var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    width: column.width,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => onSort?.(column.key)}
                      className="flex items-center gap-2 hover:opacity-70"
                    >
                      {column.label}
                      {sortBy === column.key && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className="border-t transition-colors"
                style={{
                  height: rowHeight,
                  borderColor: 'var(--border-default)',
                  cursor: onRowClick ? 'pointer' : 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tint)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {hasSelection && (
                  <td style={{ padding: '0 var(--space-4)' }}>
                    <input type="checkbox" />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      textAlign: column.align || 'left',
                      padding: '0 var(--space-4)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
