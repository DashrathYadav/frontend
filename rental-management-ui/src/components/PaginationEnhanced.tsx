import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationState, PaginationActions } from '../types/pagination';
import { formatPaginationInfo, getPageSizeOptions } from '../utils/pagination';
import { PAGINATION_TYPES } from '../constants/pagination';

interface PaginationEnhancedProps {
    pagination: PaginationState;
    actions: PaginationActions;
    showPageSizeSelector?: boolean;
    showInfo?: boolean;
    showFirstLast?: boolean;
    className?: string;
    pageSizeOptions?: number[];
    paginationType?: keyof typeof PAGINATION_TYPES;
}

const PaginationEnhanced: React.FC<PaginationEnhancedProps> = ({
    pagination,
    actions,
    showPageSizeSelector = true,
    showInfo = true,
    showFirstLast = true,
    className = '',
    pageSizeOptions,
    paginationType = PAGINATION_TYPES.SEARCH
}) => {
    const {
        pageNumber,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        isLoading
    } = pagination;

    const {
        setPage,
        setPageSize,
        nextPage,
        previousPage,
        goToFirstPage,
        goToLastPage
    } = actions;

    // Get page size options for the pagination type
    const availablePageSizes = pageSizeOptions || getPageSizeOptions(paginationType);

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, pageNumber - delta);
            i <= Math.min(totalPages - 1, pageNumber + delta);
            i++) {
            range.push(i);
        }

        if (pageNumber - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (pageNumber + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalPages <= 1 && !showPageSizeSelector) return null;

    return (
        <div className={`flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg ${className}`}>
            {/* Mobile pagination */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={previousPage}
                    disabled={!hasPreviousPage || isLoading}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={nextPage}
                    disabled={!hasNextPage || isLoading}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                {/* Left side - Info and page size selector */}
                <div className="flex items-center space-x-4">
                    {showInfo && (
                        <div>
                            <p className="text-sm text-gray-700">
                                {formatPaginationInfo(totalRecords, pageNumber, pageSize)}
                            </p>
                        </div>
                    )}

                    {showPageSizeSelector && totalRecords > 0 && (
                        <div className="flex items-center space-x-2">
                            <label htmlFor="page-size" className="text-sm text-gray-700">
                                Show:
                            </label>
                            <select
                                id="page-size"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                disabled={isLoading}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                            >
                                {availablePageSizes.map(size => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-700">per page</span>
                        </div>
                    )}
                </div>

                {/* Right side - Navigation */}
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* First page button */}
                        {showFirstLast && (
                            <button
                                onClick={goToFirstPage}
                                disabled={!hasPreviousPage || isLoading}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Go to first page"
                            >
                                <ChevronsLeft className="h-5 w-5" />
                            </button>
                        )}

                        {/* Previous page button */}
                        <button
                            onClick={previousPage}
                            disabled={!hasPreviousPage || isLoading}
                            className={`relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${!showFirstLast ? 'rounded-l-md' : ''
                                }`}
                            title="Go to previous page"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Page numbers */}
                        {getVisiblePages().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => setPage(page as number)}
                                        disabled={isLoading}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${pageNumber === page
                                                ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                                : 'text-gray-900'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}

                        {/* Next page button */}
                        <button
                            onClick={nextPage}
                            disabled={!hasNextPage || isLoading}
                            className={`relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${!showFirstLast ? 'rounded-r-md' : ''
                                }`}
                            title="Go to next page"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        {/* Last page button */}
                        {showFirstLast && (
                            <button
                                onClick={goToLastPage}
                                disabled={!hasNextPage || isLoading}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Go to last page"
                            >
                                <ChevronsRight className="h-5 w-5" />
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default PaginationEnhanced; 