'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview } from '@/lib/ga';

/**
 * GoogleAnalyticsProvider
 * 
 * Client component that initializes Google Analytics and tracks pageviews.
 * Must be mounted in the root layout.
 */
export function GoogleAnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize GA on mount
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGA(measurementId);
    }
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `₹${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

