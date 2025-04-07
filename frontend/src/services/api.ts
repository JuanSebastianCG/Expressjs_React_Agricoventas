// API base URL - would typically come from environment variables
const API_BASE_URL = '/api';

// Interface for API error responses
interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Type guard to check if response is an ApiError
const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string';
};

// Common options for fetch
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Includes cookies in cross-origin requests
};

// Helper to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  // Parse the response based on content type
  const data = isJson ? await response.json() : await response.text();
  
  // Check if the response is successful
  if (!response.ok) {
    const error: ApiError = isJson && isApiError(data) 
      ? data 
      : { message: data || response.statusText, status: response.status };
    
    throw error;
  }
  
  return data as T;
};

// GET request
const get = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    method: 'GET',
  });
  
  return handleResponse<T>(response);
};

// POST request
const post = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return handleResponse<T>(response);
};

// PUT request
const put = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  return handleResponse<T>(response);
};

// DELETE request
const del = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    method: 'DELETE',
  });
  
  return handleResponse<T>(response);
};

// API client
const api = {
  get,
  post,
  put,
  delete: del,
};

export default api; 