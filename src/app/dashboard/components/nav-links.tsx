
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function NavLinks({
  navItems,
  mobile = false,
}: {
  navItems: { href: string; label: string }[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[NavLinks] Rendered with items:', {
      count: navItems.length,
      items: navItems.map(item => item.label),
      mobile
    });
  }, [navItems, mobile]);

  // Determine the most specific matching item to avoid stale active states.
  const getIsActive = (itemHref: string) => {
    const matches = navItems.filter((it) => pathname === it.href || pathname.startsWith(it.href + '/'));
    if (matches.length === 0) return false;
    const mostSpecific = matches.sort((a, b) => b.href.length - a.href.length)[0];
    return mostSpecific.href === itemHref;
  }

  if (mobile) {
    return (
      <>
        {navItems.map((item) => {
          const isActive = getIsActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground',
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className="hidden md:flex flex-row items-center gap-5 text-sm lg:gap-6">
      {navItems.map((item) => {
        const isActive = getIsActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-foreground',
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

