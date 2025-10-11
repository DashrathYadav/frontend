import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export type ColumnAlignment = 'left' | 'center' | 'right';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: ColumnAlignment;
  className?: string;
  width?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon: React.ReactNode;
  onClick?: (row: T) => void;
  href?: (row: T) => string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  getRowId: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  hoverable?: boolean;
  striped?: boolean;
}

function DataTable<T>({
  data,
  columns,
  actions,
  sortBy,
  sortDirection = 'asc',
  onSort,
  getRowId,
  emptyMessage = 'No data available',
  className,
  stickyHeader = false,
  hoverable = true,
  striped = false,
}: DataTableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const getAlignmentClass = (align?: ColumnAlignment) => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  const getHeaderAlignmentClass = (align?: ColumnAlignment) => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <Table>
        <TableHeader className={stickyHeader ? 'sticky top-0 bg-gray-50 z-10' : ''}>
          <TableRow className="hover:bg-gray-50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  getHeaderAlignmentClass(column.align),
                  column.sortable && 'cursor-pointer select-none hover:text-blue-600',
                  column.className
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={cn('flex items-center gap-2', getHeaderAlignmentClass(column.align))}>
                  <span>{column.label}</span>
                  {column.sortable && renderSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
            {actions && actions.length > 0 && (
              <TableHead className="text-center">
                <span>Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={getRowId(row)}
              className={cn(
                hoverable && 'cursor-pointer',
                striped && index % 2 === 1 && 'bg-gray-50/30'
              )}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    getAlignmentClass(column.align),
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(row)
                    : String((row as any)[column.key] || '-')}
                </TableCell>
              ))}
              {actions && actions.length > 0 && (
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {actions.map((action, actionIndex) => {
                      const content = (
                        <>
                          {action.icon}
                          <span className="sr-only">{action.label}</span>
                        </>
                      );

                      if (action.href) {
                        return (
                          <Button
                            key={actionIndex}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            className={cn(
                              'h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors',
                              action.className
                            )}
                            asChild
                          >
                            <Link to={action.href(row)}>{content}</Link>
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={actionIndex}
                          variant={action.variant || 'ghost'}
                          size="sm"
                          className={cn(
                            'h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors',
                            action.className
                          )}
                          onClick={() => action.onClick?.(row)}
                        >
                          {content}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
