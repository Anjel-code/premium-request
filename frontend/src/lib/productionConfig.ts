// Production Configuration for Netlify
// This file centralizes all API URLs and makes them environment-aware

export const getApiBaseUrl = (): string => {
  // In production, use Netlify Functions
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';
  }
  
  // In development, use localhost
  return 'http://localhost:4242';
};

export const getFrontendUrl = (): string => {
  // In production, use environment variable
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  }
  
  // In development, use localhost
  return 'http://localhost:8080';
};

export const getStripePublishableKey = (): string => {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTgbpRLL';
};

// API Endpoints for Netlify Functions
export const API_ENDPOINTS = {
  CREATE_CHECKOUT_SESSION: `${getApiBaseUrl()}/create-checkout-session`,
  PROCESS_REFUND: `${getApiBaseUrl()}/process-refund`,
  FIND_PAYMENT_INTENT: `${getApiBaseUrl()}/find-payment-intent`,
  GET_PAYMENT_INTENT: `${getApiBaseUrl()}/get-payment-intent`,
  CHAT: `${getApiBaseUrl()}/chat`,
  CSRF_TOKEN: `${getApiBaseUrl()}/csrf-token`,
} as const;

// Success/Cancel URLs for Stripe
export const getStripeUrls = (ticketId: string, isStoreOrder: boolean = false) => {
  const baseUrl = getFrontendUrl();
  const paramName = isStoreOrder ? 'orderId' : 'ticketId';
  
  return {
    success: `${baseUrl}/success?${paramName}=${ticketId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${baseUrl}/cancel?${paramName}=${ticketId}`,
  };
}; 