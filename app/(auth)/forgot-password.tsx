// app/(auth)/forgot-password.tsx — Reset password via email (themed, inline errors)

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { friendlyAuthError, getAuthRedirect } from '../../services/authService';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../../constants/theme';
import GradientBackdrop from '../../components/ui/GradientBackdrop';
import GlassView from '../../components/ui/GlassView';
import Icon from '../../components/ui/Icon';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Masukkan email kampus kamu'); return; }
    if (!trimmed.includes('@') || !trimmed.endsWith('.ac.id')) {
      setError('Harus menggunakan email kampus (.ac.id)'); return;
    }
    setError('');
    setIsLoading(true);
    const { error: sbError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getAuthRedirect('almamatcher://reset-password'),
    });
    setIsLoading(false);
    if (sbError) { setError(friendlyAuthError(sbError.message)); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.root}>
        <GradientBackdrop blobOpacity={0.85} />
        <View style={styles.inner}>
          <View style={styles.iconRing}><Icon name="mail" size={34} color={Colors.primary} weight={2} /></View>
          <Text style={styles.title}>Email Terkirim!</Text>
          <Text style={styles.desc}>
            Cek inbox <Text style={styles.highlight}>{email.trim()}</Text> untuk link reset password.
            Jangan lupa cek folder <Text style={styles.bold}>Spam</Text>.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.backText}>← Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GradientBackdrop blobOpacity={0.85} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <View style={styles.iconRing}><Icon name="key" size={32} color={Colors.primary} weight={2} /></View>
          <Text style={styles.title}>Lupa Password?</Text>
          <Text style={styles.desc}>
            Masukkan email kampus kamu dan kami akan mengirimkan link untuk reset password.
          </Text>

          <GlassView tone="light" radius={Radii.xxl} style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{error}</Text></View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Kampus</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="nama@student.univ.ac.id"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.btnWrap, isLoading && { opacity: 0.6 }]}
            >
              <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Link Reset</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </GlassView>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundWarm },
  flex: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  iconRing: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primaryMid, marginBottom: Spacing.xs,
  },
  title: { fontSize: 27, fontFamily: Fonts.display.extrabold, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  desc: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  highlight: { color: Colors.primaryHover, fontFamily: Fonts.sans.bold },
  bold: { color: Colors.textSecondary, fontFamily: Fonts.sans.bold },

  card: { width: '100%', maxWidth: 400, padding: Spacing.xxl, gap: Spacing.md, marginTop: Spacing.sm, ...Shadows.lg },
  errorBanner: {
    backgroundColor: 'rgba(226,84,91,0.1)', borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11,
  },
  errorBannerText: { fontFamily: Fonts.sans.medium, fontSize: 13, color: Colors.error, lineHeight: 18 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontFamily: Fonts.sans.semibold, fontSize: 11, color: 'rgba(28,25,23,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.65)', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14, fontSize: 15, fontFamily: Fonts.sans.regular, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  btnWrap: { borderRadius: Radii.full, marginTop: Spacing.xs, ...Shadows.primary },
  btn: { borderRadius: Radii.full, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.sans.bold, letterSpacing: 0.3 },
  backText: { color: Colors.textTertiary, fontSize: 14, fontFamily: Fonts.sans.semibold, marginTop: Spacing.lg },
});
