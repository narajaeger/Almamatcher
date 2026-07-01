// app/(tabs)/profile/settings.tsx — Account settings (themed + glass)

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useProfileStore } from '../../../stores/profileStore';
import { Colors, Radii, Spacing, Fonts } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import GlassView from '../../../components/ui/GlassView';
import Icon, { type IconName } from '../../../components/ui/Icon';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

type Pending = 'logout' | 'delete1' | 'delete2' | null;

export default function SettingsScreen() {
  const { clearProfile } = useProfileStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  // Modal-based confirmations (Alert / window.confirm don't render reliably on web)
  const [pending, setPending] = useState<Pending>(null);

  const doLogout = async () => {
    setIsLoggingOut(true);
    setPending(null);
    try {
      await supabase.auth.signOut();
    } finally {
      clearProfile();
      router.replace('/(auth)/login');
    }
  };

  const doDeleteAccount = async () => {
    setIsDeleting(true);
    setPending(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Best-effort: remove the profile row (cascades to related data via FK).
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id);
      }
    } catch {
      // ignore — we still sign the user out below
    }
    await supabase.auth.signOut();
    clearProfile();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <Text style={styles.title}>Pengaturan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Notifikasi">
          <ToggleRow icon="bell" label="Match baru" subLabel="Saat ada yang suka balik" value={notifMatch} onChange={setNotifMatch} />
          <Divider />
          <ToggleRow icon="chat" label="Pesan baru" subLabel="Saat ada pesan masuk" value={notifMessage} onChange={setNotifMessage} />
        </Section>

        <Section title="Akun">
          <ActionRow icon="edit" label="Edit Profil" onPress={() => router.push('/(tabs)/profile/edit')} />
          <Divider />
          <ActionRow icon="lock" label="Kebijakan Privasi" onPress={() => router.push('/legal/privacy')} />
          <Divider />
          <ActionRow icon="filter" label="Syarat & Ketentuan" onPress={() => router.push('/legal/terms')} />
          <Divider />
          <ActionRow icon="send" label="Hubungi Kami" onPress={() => router.push('/legal/contact')} />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setPending('logout')} disabled={isLoggingOut} activeOpacity={0.85}>
          {isLoggingOut ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Icon name="logout" size={18} color={Colors.primary} weight={2.2} />
              <Text style={styles.logoutText}>Keluar</Text>
            </>
          )}
        </TouchableOpacity>

        <Section title="Zona Berbahaya" danger>
          <ActionRow icon="close" label="Hapus Akun" danger onPress={() => setPending('delete1')} />
        </Section>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>AlmaMatcher v1.0.0</Text>
          <Text style={styles.versionSub}>Made with care for Indonesian students</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={pending === 'logout'}
        title="Keluar?"
        message="Kamu yakin ingin logout dari AlmaMatcher?"
        confirmLabel="Keluar"
        destructive
        loading={isLoggingOut}
        onConfirm={doLogout}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        visible={pending === 'delete1'}
        title="Hapus Akun"
        message="Tindakan ini permanen dan tidak bisa dibatalkan. Semua data kamu akan dihapus."
        confirmLabel="Lanjut"
        destructive
        onConfirm={() => setPending('delete2')}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        visible={pending === 'delete2'}
        title="Konfirmasi Sekali Lagi"
        message="Yakin ingin menghapus akun secara permanen?"
        confirmLabel="Hapus Permanen"
        destructive
        loading={isDeleting}
        onConfirm={doDeleteAccount}
        onCancel={() => setPending(null)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={[sectionStyles.title, danger && { color: Colors.error }]}>{title}</Text>
      <GlassView tone="light" radius={Radii.lg} style={sectionStyles.card}>{children}</GlassView>
    </View>
  );
}

function ToggleRow({
  icon, label, subLabel, value, onChange,
}: {
  icon: IconName; label: string; subLabel: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}><Icon name={icon} size={18} color={Colors.primary} weight={2} /></View>
      <View style={rowStyles.textCol}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.sub}>{subLabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.borderMid, true: Colors.primaryMid }}
        thumbColor={value ? Colors.primary : Colors.surface}
      />
    </View>
  );
}

function ActionRow({
  icon, label, onPress, danger,
}: {
  icon: IconName; label: string; onPress: () => void; danger?: boolean;
}) {
  const tint = danger ? Colors.error : Colors.primary;
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[rowStyles.iconWrap, danger && { backgroundColor: 'rgba(226,84,91,0.12)' }]}>
        <Icon name={icon} size={18} color={tint} weight={2} />
      </View>
      <Text style={[rowStyles.label, { flex: 1 }, danger && { color: Colors.error }]}>{label}</Text>
      <Icon name="chevronRight" size={18} color={Colors.textTertiary} weight={2} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={rowStyles.divider} />;
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: { fontSize: 19, fontFamily: Fonts.display.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  content: { paddingTop: Spacing.md },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xxl,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    borderRadius: Radii.full, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  logoutText: { fontSize: 15, fontFamily: Fonts.sans.bold, color: Colors.primary },
  versionRow: { alignItems: 'center', paddingVertical: Spacing.lg },
  versionText: { fontSize: 13, color: Colors.textTertiary, fontFamily: Fonts.sans.semibold },
  versionSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2, fontFamily: Fonts.sans.regular },
});

const sectionStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  title: {
    fontSize: 11, fontFamily: Fonts.sans.bold, color: Colors.textTertiary,
    marginBottom: Spacing.sm, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1.4,
  },
  card: { overflow: 'hidden' },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 13, gap: Spacing.md,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontSize: 15, color: Colors.textPrimary, fontFamily: Fonts.sans.semibold },
  sub: { fontSize: 12, color: Colors.textTertiary, marginTop: 1, fontFamily: Fonts.sans.regular },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 60 },
});
