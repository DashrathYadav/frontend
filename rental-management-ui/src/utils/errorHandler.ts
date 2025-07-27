import { AxiosError } from 'axios';
import { ApiResponse } from '../types';

export interface ApiError {
    statusCode: number;
    message: string;
    errors?: string[];
}

export const extractErrorMessage = (error: unknown): ApiError => {
    if (error instanceof AxiosError) {
        const statusCode = error.response?.status || 500;

        // Try to extract error message from the response
        if (error.response?.data) {
            const responseData = error.response.data as any;

            // Check if it's our standard API response format
            if (responseData.message && typeof responseData.message === 'string') {
                return {
                    statusCode,
                    message: responseData.message,
                    errors: responseData.errors || []
                };
            }

            // Check if it's a validation error response
            if (responseData.errors && Array.isArray(responseData.errors)) {
                return {
                    statusCode,
                    message: responseData.message || 'Validation failed',
                    errors: responseData.errors
                };
            }

            // Fallback to any message in the response
            if (responseData.message) {
                return {
                    statusCode,
                    message: responseData.message,
                    errors: []
                };
            }
        }

        // Default error messages based on status code
        const defaultMessages: Record<number, string> = {
            400: 'Bad Request - Please check your input data',
            401: 'Unauthorized - Please log in again',
            403: 'Forbidden - You do not have permission to perform this action',
            404: 'Not Found - The requested resource was not found',
            409: 'Conflict - The resource already exists',
            422: 'Validation Error - Please check your input data',
            500: 'Internal Server Error - Please try again later',
            502: 'Bad Gateway - Service temporarily unavailable',
            503: 'Service Unavailable - Please try again later'
        };

        return {
            statusCode,
            message: defaultMessages[statusCode] || `Request failed with status code ${statusCode}`,
            errors: []
        };
    }

    // Handle non-Axios errors
    if (error instanceof Error) {
        return {
            statusCode: 500,
            message: error.message,
            errors: []
        };
    }

    // Fallback for unknown errors
    return {
        statusCode: 500,
        message: 'An unexpected error occurred',
        errors: []
    };
};

export const formatErrorMessage = (error: unknown): string => {
    const apiError = extractErrorMessage(error);

    let message = `Request failed with status code ${apiError.statusCode}`;

    if (apiError.message) {
        message += `\n${apiError.message}`;
    }

    if (apiError.errors && apiError.errors.length > 0) {
        message += `\n\nDetails:\n${apiError.errors.map(err => `• ${err}`).join('\n')}`;
    }

    return message;
}; 