// CSRF Token management utilities

let csrfToken: string | null = null;

// Get CSRF token from server
export const getCSRFToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch('http://localhost:4242/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.token;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }
  
  return '';
};

// Add CSRF token to request headers
export const addCSRFToken = async (headers: Headers): Promise<void> => {
  const token = await getCSRFToken();
  if (token) {
    headers.set('X-CSRF-Token', token);
  }
};

// Create a fetch wrapper with CSRF protection
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getCSRFToken();
  
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
    credentials: 'include',
  };
  
  return fetch(url, secureOptions);
}; 