/**
 * Logout Button Component
 * 
 * Provides a button to sign out the current user.
 * Can be used in headers, sidebars, or user menus.
 */

'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  className = '',
  showIcon = true,
  children 
}: LogoutButtonProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      onClick={handleLogout}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || 'Logout'}
    </Button>
  );
}
