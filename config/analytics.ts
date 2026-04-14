import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  if (measurementId) {
    ReactGA.initialize(measurementId);
    console.log('Google Analytics initialized with ID:', measurementId);
    
    // Test that GA is working by sending a test event
    ReactGA.event({
      category: 'Debug',
      action: 'GA Initialized',
      label: 'Analytics Setup Complete',
    });
    console.log('GA test event sent');
  } else {
    console.error('No GA Measurement ID provided');
  }
};

// Track page views
export const trackPageView = (path: string) => {
  console.log('Tracking page view:', path);
  ReactGA.send({ hitType: 'pageview', page: path });
};

// Track custom events
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Track ecommerce events
export const trackAddToCart = (productId: string, productName: string, price: number, currency: string, quantity: number = 1) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'Add to Cart',
    label: productName,
    value: Math.round(price * 100), // GA expects value in cents
  });
};

export const trackRemoveFromCart = (productId: string, productName: string, price: number, currency: string, quantity: number = 1) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'Remove from Cart',
    label: productName,
    value: Math.round(price * 100),
  });
};

export const trackBeginCheckout = (total: number, currency: string, items: Array<{id: string, name: string, price: number, quantity: number}>) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'Begin Checkout',
    value: Math.round(total * 100),
  });
};

export const trackPurchase = (transactionId: string, total: number, currency: string, items: Array<{id: string, name: string, price: number, quantity: number}>) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'Purchase',
    label: transactionId,
    value: Math.round(total * 100),
  });
};

// Track user interactions
export const trackProductView = (productId: string, productName: string, category: string, price: number, currency: string) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'View Item',
    label: productName,
    value: Math.round(price * 100),
  });
};

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  ReactGA.event({
    category: 'Search',
    action: 'Search',
    label: searchTerm,
    value: resultsCount,
  });
};

export const trackCategoryView = (category: string) => {
  ReactGA.event({
    category: 'Navigation',
    action: 'View Category',
    label: category,
  });
};

export const trackLanguageChange = (language: string) => {
  ReactGA.event({
    category: 'User',
    action: 'Change Language',
    label: language,
  });
};

export const trackCurrencyChange = (currency: string) => {
  ReactGA.event({
    category: 'User',
    action: 'Change Currency',
    label: currency,
  });
};

// Track site version for comparison with old site
export const trackSiteVersion = (version: string) => {
  ReactGA.event({
    category: 'Site',
    action: 'Version Load',
    label: version,
  });
}; 