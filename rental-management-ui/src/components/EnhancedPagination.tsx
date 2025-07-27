import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  PaginationEllipsis,
} from './ui/pagination';

interface EnhancedPaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isLoading?: boolean;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
    currentPage,
    totalPages,
    pageSize,
    totalRecords,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [6, 12, 24, 48],
    hasNextPage,
    hasPreviousPage,
    isLoading = false
}) => {
    const [pageInput, setPageInput] = React.useState(currentPage.toString());

    React.useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const page = parseInt(pageInput);
            if (page >= 1 && page <= totalPages) {
                onPageChange(page);
            } else {
                setPageInput(currentPage.toString());
            }
        }
    };

    const handlePageInputBlur = () => {
        const page = parseInt(pageInput);
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalPages <= 1 && pageSizeOptions.length <= 1) return null;

    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => onPageSizeChange(parseInt(value))}
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Records Info */}
            <div className="text-sm text-gray-600">
                Showing {startRecord} to {endRecord} of {totalRecords} records
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                {/* First Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={!hasPreviousPage || isLoading}
                    className="hidden sm:flex"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Previous Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPreviousPage || isLoading}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <PaginationEllipsis />
                            ) : (
                                <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(page as number)}
                                    disabled={isLoading}
                                    className="w-8 h-8 p-0"
                                >
                                    {page}
                                </Button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage || isLoading}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Last Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={!hasNextPage || isLoading}
                    className="hidden sm:flex"
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>

                {/* Page Input */}
                <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onKeyPress={handlePageInputKeyPress}
                        onBlur={handlePageInputBlur}
                        className="w-16 h-8 text-center"
                        disabled={isLoading}
                    />
                    <span className="text-sm text-gray-600">of {totalPages}</span>
                </div>
            </div>
        </div>
    );
};

export default EnhancedPagination; 