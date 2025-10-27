/**
 * PostHog Analytics Client
 * Handles event tracking and feature flags
 */

class PostHogClient {
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.POSTHOG_API_KEY || '';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      console.warn('??  PostHog not configured - analytics disabled');
    }
  }

  /**
   * Track user event
   */
  trackEvent(userId: string, eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    try {
      // Send to PostHog API
      const event = {
        api_key: this.apiKey,
        event: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
        distinct_id: userId,
      };

      // In production, use: fetch('https://api.posthog.com/capture/', { method: 'POST', body: JSON.stringify(event) })
      console.log(`?? [Analytics] ${eventName} - ${userId}`, properties);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(userId: string, page: string, properties?: Record<string, any>) {
    this.trackEvent(userId, '$pageview', {
      $current_url: page,
      ...properties,
    });
  }

  /**
   * Track error event
   */
  trackError(userId: string, error: Error, context?: Record<string, any>) {
    this.trackEvent(userId, 'error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Track API call
   */
  trackApiCall(userId: string, method: string, endpoint: string, statusCode: number, duration: number) {
    this.trackEvent(userId, 'api_call', {
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
    });
  }

  /**
   * Track vendor action
   */
  trackVendorAction(userId: string, action: string, vendorId: string) {
    this.trackEvent(userId, `vendor_${action}`, {
      vendor_id: vendorId,
    });
  }

  /**
   * Track order action
   */
  trackOrderAction(userId: string, action: string, orderId: string, type: 'po' | 'so') {
    this.trackEvent(userId, `${type}_${action}`, {
      order_id: orderId,
    });
  }
}

export const posthogClient = new PostHogClient();

