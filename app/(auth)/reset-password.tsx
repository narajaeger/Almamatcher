// app/(auth)/reset-password.tsx — Set a new password (themed, inline errors)
// Handles deep-link almamatcher://reset-password; Supabase sets a recovery session.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { friendlyAuthError } from '../../services/authService';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../../constants/theme';
import GradientBackdrop from '../../components/ui/GradientBackdrop';
import GlassView from '../../components/ui/GlassView';
import Icon from '../../components/ui/Icon';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) { setError('Password minimal 8 karakter'); return; }
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (updateError) { setError(friendlyAuthError(updateError.message)); return; }
    setDone(true);
  };

  if (done) {
    return (
      <View style={styles.root}>
        <GradientBackdrop blobOpacity={0.85} />
        <View style={styles.inner}>
          <View style={[styles.iconRing, { backgroundColor: Colors.secondaryLight, borderColor: Colors.secondaryMid }]}>
            <Icon name="check" size={34} color={Colors.secondary} weight={2.6} />
          </View>
          <Text style={styles.title}>Password Diperbarui!</Text>
          <Text style={styles.desc}>Password kamu berhasil diubah. Silakan login kembali.</Text>
          <TouchableOpacity
            onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); }}
            activeOpacity={0.85}
            style={[styles.btnWrap, { marginTop: Spacing.lg }]}
          >
            <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>Ke Halaman Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.root}>
        <GradientBackdrop blobOpacity={0.85} />
        <View style={styles.inner}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.waitText}>Memverifikasi link reset...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GradientBackdrop blobOpacity={0.85} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <View style={styles.iconRing}><Icon name="lock" size={30} color={Colors.primary} weight={2} /></View>
          <Text style={styles.title}>Buat Password Baru</Text>
          <Text style={styles.desc}>Masukkan password baru untuk akun AlmaMatcher kamu.</Text>

          <GlassView tone="light" radius={Radii.xxl} style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{error}</Text></View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password Baru</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput, error ? styles.inputError : null]}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoFocus
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.passwordToggleText}>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Ulangi password baru"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.btnWrap, isLoading && { opacity: 0.6 }]}
            >
              <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Simpan Password Baru</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </GlassView>
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
  waitText: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, textAlign: 'center', marginTop: Spacing.lg },

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
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 104 },
  passwordToggle: { position: 'absolute', right: Spacing.lg, top: 0, bottom: 0, justifyContent: 'center' },
  passwordToggleText: { fontFamily: Fonts.sans.semibold, fontSize: 12, color: Colors.primaryHover },
  btnWrap: { borderRadius: Radii.full, marginTop: Spacing.xs, ...Shadows.primary },
  btn: { borderRadius: Radii.full, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.sans.bold, letterSpacing: 0.3 },
});
