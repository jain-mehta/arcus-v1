/**
 * Google Analytics (gtag.js) Integration
 * 
 * Provides a minimal, centralized wrapper for Google Analytics 4.
 * This module exports functions to initialize GA, track pageviews, and custom events.
 * 
 * Environment Variable Required:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID: Your GA4 Measurement ID (e.g., G-XXXXXXXXXX)
 * 
 * Usage:
 * - Call initGA() once in your root layout on client mount
 * - Call pageview() on route changes
 * - Call event() for custom tracking (user actions, conversions, etc.)
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize Google Analytics
 * @param measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 */
export function initGA(measurementId: string): void {
  if (!measurementId || typeof window === 'undefined') {
    console.warn('[GA] Measurement ID not provided or not in browser context. GA will not be initialized.');
    return;
  }

  // Inject the Google Analytics script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  };
  
  // Set initial timestamp
  window.gtag('js', new Date());
  
  // Configure with measurement ID
  window.gtag('config', measurementId, {
    page_path: window.location.pathname,
  });

  console.log('[GA] Initialized with measurement ID:', measurementId);
}

/**
 * Track a pageview
 * @param url - The page URL/path to track
 */
export function pageview(url: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return; // GA not initialized or not in browser
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  window.gtag('config', measurementId, {
    page_path: url,
  });
}

/**
 * Track a custom event
 * @param action - The event action name (e.g., 'login', 'purchase', 'click_button')
 * @param category - Event category (e.g., 'engagement', 'conversion')
 * @param label - Optional event label for additional context
 * @param value - Optional numeric value associated with the event
 */
export function event({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return; // GA not initialized or not in browser
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
