"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast({ variant: 'destructive', title: 'Error', description: payload.error || 'Failed to load sessions' });
        return;
      }
      const payload = await res.json();
      setSessions(payload.sessions || []);
      setCurrentSessionId(payload.currentSessionId || null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sessions' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingRevokeId, setPendingRevokeId] = React.useState<string | null>(null);

  function openConfirm(id: string) {
    setPendingRevokeId(id);
    setConfirmOpen(true);
  }

  async function confirmRevoke() {
    if (!pendingRevokeId) return;
    try {
      const res = await fetch(`/api/admin/sessions?id=${encodeURIComponent(pendingRevokeId)}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Error', description: payload.error || 'Failed to revoke session' });
        return;
      }
      toast({ title: 'Revoked', description: 'Session revoked' });
      setConfirmOpen(false);
      setPendingRevokeId(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to revoke session' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading...</div>}
        {!loading && sessions.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No active sessions found. When users sign in, their sessions will appear here where admins can revoke them.
          </div>
        )}
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">{s.deviceInfo || 'web'}</div>
                  {s.ip && <div className="text-sm text-muted-foreground">{s.ip}</div>}
                  {s.location && <div className="text-sm text-muted-foreground">{s.location}</div>}
                  {currentSessionId === s.id && <div className="text-xs text-green-600 font-medium">Current session</div>}
                </div>
                <div className="text-sm text-muted-foreground">{s.id}  {s.userId}</div>
                <div className="text-sm text-muted-foreground">Created {new Date(s.createdAt).toLocaleString()}  Last seen {new Date(s.lastSeen).toLocaleString()}  Expires {new Date(s.expiresAt).toLocaleString()}</div>
              </div>
              <div>
                <Button variant="destructive" onClick={() => openConfirm(s.id)} disabled={currentSessionId === s.id}>Revoke</Button>
              </div>
            </div>
          ))}
        </div>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Session</DialogTitle>
            </DialogHeader>
            <div className="py-2">Are you sure you want to revoke this session? The user will be forced to sign in again on that device.</div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmRevoke}>Revoke</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

