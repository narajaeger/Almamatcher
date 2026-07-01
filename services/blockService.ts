// services/blockService.ts
// Block and report users

import { supabase } from '../lib/supabase';

export type ReportReason =
  | 'spam'
  | 'fake_profile'
  | 'inappropriate'
  | 'harassment'
  | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam:          'Spam',
  fake_profile:  'Profil Palsu',
  inappropriate: 'Konten Tidak Pantas',
  harassment:    'Pelecehan',
  other:         'Lainnya',
};

// ============================================
// BLOCK
// ============================================

export async function blockUser(blockedId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId });

  if (error && error.code !== '23505') return { error: error.message }; // ignore duplicate
  return {};
}

export async function unblockUser(blockedId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);
}

export async function getBlockedIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);
  return (data ?? []).map((r: any) => r.blocked_id);
}

// ============================================
// REPORT
// ============================================

export async function reportUser(
  reportedId: string,
  reason: ReportReason,
  note?: string,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: user.id, reported_id: reportedId, reason, note: note ?? null });

  if (error) return { error: error.message };
  return {};
}
