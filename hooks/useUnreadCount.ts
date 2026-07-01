// hooks/useUnreadCount.ts
// Tracks total unread message count for the current user.
// Updates in real-time via Supabase Realtime.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadCount(): number {
  const [count, setCount] = useState(0);
  // Stable ref so the realtime callback never captures a stale closure
  const countRef = useRef(count);

  useEffect(() => {
    let cancelled = false;

    const refetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null);

      if (!cancelled) setCount(c ?? 0);
    };

    refetch();

    // Unique name per mount so React Strict Mode double-invoke
    // never hits an already-subscribed channel.
    const channelName = `unread-count-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        refetch,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        refetch,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []); // no deps — refetch is defined inside, always fresh

  return count;
}
