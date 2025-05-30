/**
 * API Utilities for consistent error handling and response processing
 */

import { toast } from 'react-toastify';

// Types of errors that can occur during API operations
const ErrorTypes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };
  
  /**
   * Maps HTTP status codes to error types
   * @param {number} statusCode - HTTP status code
   * @returns {string} - Error type constant
   */
  const mapStatusToErrorType = (statusCode) => {
    if (!statusCode) return ErrorTypes.UNKNOWN_ERROR;
    
    const errorMap = {
      400: ErrorTypes.VALIDATION_ERROR,
      401: ErrorTypes.AUTH_ERROR,
      403: ErrorTypes.AUTH_ERROR,
      404: ErrorTypes.NOT_FOUND_ERROR,
      409: ErrorTypes.CONFLICT_ERROR,
      500: ErrorTypes.SERVER_ERROR
    };
    
    return errorMap[statusCode] || ErrorTypes.UNKNOWN_ERROR;
  };
  
  /**
   * Formats error responses consistently
   * @param {Error|Object} error - Error object or response data
   * @param {number} status - HTTP status code (optional)
   * @returns {Object} - Formatted error object
   */
  const formatError = (error, status = null) => {
    // Handle fetch errors (network issues)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorTypes.NETWORK_ERROR,
        message: 'Unable to connect to the server. Please check your internet connection.',
        originalError: error
      };
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError' || (error.message && error.message.includes('timeout'))) {
      return {
        type: ErrorTypes.TIMEOUT_ERROR,
        message: 'Request timed out. Please try again.',
        originalError: error
      };
    }
    
    // Handle server response errors with error object
    if (error.error || error.message) {
      return {
        type: mapStatusToErrorType(status),
        message: error.error || error.message || 'An error occurred',
        details: error.details || error.errors || null,
        originalError: error
      };
    }
    
    // Default unknown error
    return {
      type: ErrorTypes.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      originalError: error
    };
  };
  
  /**
   * Wrap API calls with consistent error handling
   * @param {Function} apiCall - Async function that makes API request
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<Object>} - Response with data or error
   */
  const handleApiCall = async (apiCall, options = {}) => {
    const { timeout = 30000, errorMessage = 'An error occurred' } = options;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await apiCall(controller.signal);
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Handle successful responses
      if (response.ok) {
        return {
          success: true,
          data: isJson ? await response.json() : await response.text(),
          status: response.status
        };
      }
      
      // Handle error responses
      const errorData = isJson ? await response.json() : { message: await response.text() };
      return {
        success: false,
        error: formatError(errorData, response.status),
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
        status: 0
      };
    }
  };
  
  /**
   * Makes a GET request with error handling
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch API options and error handling options
   * @returns {Promise<Object>} - Response with data or error
   */
  export const apiGet = async (url, options = {}) => {
    return handleApiCall(
      async (signal) => {
        const fetchOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...options.headers
          },
          signal,
          ...options.fetchOptions
        };
        return fetch(url, fetchOptions);
      },
      options
    );
  };
  
  /**
   * Makes a POST request with error handling
   * @param {string} url - API endpoint URL
   * @param {Object} data - Data to send in request body
   * @param {Object} options - Fetch API options and error handling options
   * @returns {Promise<Object>} - Response with data or error
   */
  export const apiPost = async (url, data, options = {}) => {
    return handleApiCall(
      async (signal) => {
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(data),
          signal,
          ...options.fetchOptions
        };
        return fetch(url, fetchOptions);
      },
      options
    );
  };
  
  /**
   * Makes a PUT request with error handling
   * @param {string} url - API endpoint URL
   * @param {Object} data - Data to send in request body
   * @param {Object} options - Fetch API options and error handling options
   * @returns {Promise<Object>} - Response with data or error
   */
  export const apiPut = async (url, data, options = {}) => {
    return handleApiCall(
      async (signal) => {
        const fetchOptions = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(data),
          signal,
          ...options.fetchOptions
        };
        return fetch(url, fetchOptions);
      },
      options
    );
  };
  
  /**
   * Makes a DELETE request with error handling
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch API options and error handling options
   * @returns {Promise<Object>} - Response with data or error
   */
  export const apiDelete = async (url, options = {}) => {
    return handleApiCall(
      async (signal) => {
        const fetchOptions = {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            ...options.headers
          },
          signal,
          ...options.fetchOptions
        };
        return fetch(url, fetchOptions);
      },
      options
    );
  };
  
  /**
   * Helper function to handle API responses consistently in app logic
   * @param {Object} response - Response from API call
   * @param {Function} onSuccess - Function to call on success
   * @param {Function} onError - Function to call on error
   * @returns {any} - Result of success or error handler
   */
  export const handleApiResponse = (response, onSuccess, onError) => {
    if (response.success) {
      return onSuccess(response.data);
    } else {
      return onError ? 
        onError(response.error) : 
        console.error(`API Error: ${response.error.message}`, response.error);
    }
  };

  /**
   * Default error handler that shows toast notifications
   * @param {Object} error - Error object
   * @returns {Object} - Object with error property
   */
  export const defaultApiErrorHandler = (error) => {
    console.error('API Error:', error);
    toast.error(error.message || 'An unexpected error occurred', {
      position: "top-center"
    });
    return { error };
  };
  
  export {
  ErrorTypes,
  formatError
};
