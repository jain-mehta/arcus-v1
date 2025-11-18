

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { Bell, ChevronsLeft, Menu } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLinks } from './components/nav-links';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import type { PermissionMap } from '@/lib/rbac';
import { filterNavItems } from '@/lib/navigation-mapper';

// Sidebar items are now passed in as props, no longer hardcoded here.
export interface NavItem {
  href: string;
  label: string;
  icon?: keyof typeof Icons;
  permission: string;
}

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  navConfig: any;
  userPermissions: PermissionMap | null;
  loading: boolean;
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null
}

export function DashboardClientLayout({ 
  children, 
  navConfig,
  userPermissions,
  loading, 
  currentUser 
}: DashboardClientLayoutProps) {
  const pathname = usePathname();
  
  if (!currentUser) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                        <LogIn className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Access Denied</CardTitle>
                    <CardDescription>You are not logged in. Please log in to access the dashboard.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  // --- NEW PERMISSION-MAP BASED SIDEBAR LOGIC ---

  // Log the permissions received on the client
  if (typeof window !== 'undefined') {
    console.log('[ClientLayout] Permissions received:', {
      permissionsExist: !!userPermissions,
      permissionKeys: userPermissions ? Object.keys(userPermissions).length : 0,
      permissionModules: userPermissions ? Object.keys(userPermissions).slice(0, 3) : null,
      firstModuleSample: userPermissions ? Object.entries(userPermissions)[0] : null
    });
  }

  // Filter main nav items based on user permissions using new PermissionMap structure
  const filteredAccessibleNavItems = filterNavItems(navConfig.main, userPermissions);
  const accessibleNavItems = filteredAccessibleNavItems.map((it: any) => ({
    href: it.href || '#',
    label: it.label,
    icon: (it.icon && (it.icon as keyof typeof Icons)) || undefined,
    permission: it.permission,
  }));
  
  // Log filtered items on client side
  if (typeof window !== 'undefined') {
    console.log('[ClientLayout] Filtered main nav items:', {
      originalCount: navConfig.main.length,
      filteredCount: accessibleNavItems.length,
      items: accessibleNavItems.map((item: any) => item.label)
    });
  }

  // Find the current module's sub-navigation key by finding the longest matching path prefix.
  const subNavKeys = Object.keys(navConfig.subNavigation) as Array<keyof typeof navConfig.subNavigation>;
  const currentSubNavKey = subNavKeys
    .filter(key => pathname.startsWith(key as string))
    .sort((a, b) => (b as string).length - (a as string).length)[0];

  // Get the sub-nav items for the current module and filter them.
  const subNavItems = currentSubNavKey ? navConfig.subNavigation[currentSubNavKey] : [];
  
  // Filter sub-nav items based on user permissions
  // filterNavItems will return all items if user is admin (detected by having all major modules)
  const accessibleSubNavItems = filterNavItems(subNavItems, userPermissions);

  // Map the sub-nav items to the local NavItem type, coercing the icon string to a valid Icons key
  // when possible. This ensures the prop types match and avoids widening string types.
  const sidebarNavItems: any[] = accessibleSubNavItems.map((it: any) => ({
    href: it.href || '#',
    label: it.label,
    // Coerce to 'keyof typeof Icons'. If the icon is not present in Icons, leave undefined.
    icon: (it.icon && (it.icon as keyof typeof Icons)) || undefined,
    permission: it.permission,
  }));

  // The sidebar should be shown if there are any accessible sub-nav items.
  const showSidebar = sidebarNavItems.length > 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 z-40">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Icons.logo className="h-6 w-6" />
              <span className='font-bold whitespace-nowrap'>Bobs Bath Fittings Pvt Ltd</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {loading ? <Skeleton className="h-6 w-96 hidden md:flex" /> : <NavLinks navItems={accessibleNavItems} />}

            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background">
                    <SheetHeader>
                        <span className="sr-only">Mobile Navigation Menu</span>
                    </SheetHeader>
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                        >
                        <Icons.logo className="h-6 w-6" />
                        <span className='text-lg font-bold whitespace-nowrap'>Bobs Bath Fittings</span>
                        </Link>
                        {loading ? <Skeleton className="h-48 w-full" /> : <NavLinks navItems={accessibleNavItems} mobile />}
                    </nav>
                </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
            <UserNav user={currentUser} />
          </div>
        </header>
        <div className="flex flex-1">
          {showSidebar && <UniversalSidebar navItems={sidebarNavItems} />}
          <main className={cn(
            "flex flex-1 flex-col gap-4 p-4 transition-all duration-300 ease-in-out md:gap-8 md:p-8",
            showSidebar && "md:ml-[var(--sidebar-width-icon)] group-data-[sidebar-collapsed=false]:md:ml-[var(--sidebar-width)]"
          )}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UniversalSidebar({ navItems }: { navItems: any[] }) {
    const { state: sidebarState, toggleSidebar } = useSidebar();
    const isCollapsed = sidebarState === 'collapsed';
    const pathname = usePathname();

  // Return true only for the most specific matching nav item. This avoids
  // leaving a previously selected item active when navigating to another
  // sub-route in the same module.
  const checkIsActive = (href: string) => {
    const matches = navItems.filter((it) => pathname === it.href || pathname.startsWith(`${it.href}/`));
    if (matches.length === 0) return false;
    // Pick the longest matching href (most specific)
    const mostSpecific = matches.sort((a, b) => b.href.length - a.href.length)[0];
    return mostSpecific.href === href;
  };

    return (
        <Sidebar>
            <SidebarHeader className="flex h-16 items-center justify-center border-b px-4 lg:px-6">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleSidebar}
                >
                    <ChevronsLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
                    <span className="sr-only">Toggle Sidebar</span>
                 </Button>
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarMenu className="grid items-start px-2 py-4 text-sm font-medium lg:px-4">
                    {navItems.map((item) => {
                        const IconComponent = item.icon ? Icons[item.icon as keyof typeof Icons] : null;
                        return IconComponent && (
                            <SidebarMenuItem key={item.href + item.label}>
                                <Link href={item.href}>
                                    <SidebarMenuButton
                                        isActive={checkIsActive(item.href)}
                                        tooltip={isCollapsed ? item.label : undefined}
                                    >
                                        <IconComponent className="h-4 w-4" />
                                        <span className={cn(isCollapsed && "sr-only")}>{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
             <SidebarFooter className="mt-auto p-4" />
        </Sidebar>
    );
}

function UserNav({ user }: { user: DashboardClientLayoutProps['currentUser'] }) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call the logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
                <AvatarImage src={`https://picsum.photos/seed/${user?.id}/40/40`} alt={user?.name || 'User'} data-ai-hint="person portrait"/>
               {/* {<AvatarFallback>{user?.name.charAt(0) || 'U'}</AvatarFallback>} */}
            </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>
            <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}


// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
