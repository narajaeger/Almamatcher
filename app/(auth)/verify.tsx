// app/(auth)/verify.tsx — Email verification notice (themed, inline status)

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resendVerificationEmail, friendlyAuthError } from '../../services/authService';
import { Colors, Radii, Spacing, Shadows, Fonts } from '../../constants/theme';
import GradientBackdrop from '../../components/ui/GradientBackdrop';
import GlassView from '../../components/ui/GlassView';
import Icon from '../../components/ui/Icon';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setStatus(null);
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      setStatus({ type: 'ok', msg: 'Email verifikasi sudah dikirim ulang. Cek inbox & folder spam ya.' });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setStatus({ type: 'err', msg: friendlyAuthError(error?.message) });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <GradientBackdrop blobOpacity={0.85} />
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Icon name="send" size={34} color={Colors.primary} weight={2} />
        </View>

        <Text style={styles.title}>Cek Email Kamu!</Text>
        <Text style={styles.description}>Kami sudah mengirim link verifikasi ke:</Text>

        <GlassView tone="light" radius={Radii.full} style={styles.emailBadge}>
          <Text style={styles.emailText}>{email}</Text>
        </GlassView>

        <Text style={styles.hint}>
          Buka emailmu dan klik link verifikasi untuk melanjutkan. Jangan lupa cek folder{' '}
          <Text style={styles.bold}>Spam</Text>.
        </Text>

        {status && (
          <View style={[styles.statusBox, status.type === 'ok' ? styles.statusOk : styles.statusErr]}>
            <Text style={[styles.statusText, { color: status.type === 'ok' ? Colors.secondaryHover : Colors.error }]}>
              {status.msg}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnResend, (isResending || resendCooldown > 0) && styles.btnDisabled]}
          onPress={handleResend}
          disabled={isResending || resendCooldown > 0}
          activeOpacity={0.85}
        >
          {isResending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.btnResendText}>
              {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Email'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backText}>← Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundWarm, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 32, alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 380 },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.primaryMid,
  },
  title: { fontSize: 27, fontFamily: Fonts.display.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  description: { fontSize: 14.5, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, textAlign: 'center' },
  emailBadge: { paddingHorizontal: Spacing.lg, paddingVertical: 11, marginVertical: 4 },
  emailText: { color: Colors.primaryHover, fontFamily: Fonts.sans.bold, fontSize: 15 },
  hint: { fontSize: 13, color: Colors.textTertiary, fontFamily: Fonts.sans.regular, textAlign: 'center', lineHeight: 20 },
  bold: { color: Colors.textSecondary, fontFamily: Fonts.sans.bold },
  statusBox: { borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11, borderWidth: 1, alignSelf: 'stretch' },
  statusOk: { backgroundColor: Colors.secondaryLight, borderColor: Colors.secondaryMid },
  statusErr: { backgroundColor: 'rgba(226,84,91,0.1)', borderColor: 'rgba(226,84,91,0.32)' },
  statusText: { fontSize: 13, fontFamily: Fonts.sans.medium, lineHeight: 18, textAlign: 'center' },
  btnResend: {
    borderWidth: 1.5, borderColor: Colors.primaryMid, borderRadius: Radii.full,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.5)', ...Shadows.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnResendText: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.sans.bold },
  backText: { color: Colors.textTertiary, fontSize: 14, fontFamily: Fonts.sans.semibold, marginTop: Spacing.xs },
});
