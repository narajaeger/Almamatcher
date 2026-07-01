// app/(auth)/register.tsx — Create account (themed + cross-platform inline errors)

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { signUpWithEmail, friendlyAuthError } from '../../services/authService';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../../constants/theme';
import GradientBackdrop from '../../components/ui/GradientBackdrop';
import GlassView from '../../components/ui/GlassView';

const PRIVACY_POLICY_VERSION = '1.0';

const registerSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .refine((val) => val.endsWith('.ac.id'), {
      message: 'Wajib menggunakan email kampus (.ac.id)',
    }),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    if (!consentChecked) {
      setFormError('Kamu harus menyetujui Kebijakan Privasi untuk mendaftar.');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    try {
      const result = await signUpWithEmail(
        data.email,
        data.password,
        { consentAt: new Date().toISOString(), consentVersion: PRIVACY_POLICY_VERSION },
      );
      // Supabase quirk: with "Confirm email" ON, signing up with an email that
      // already exists returns a fake success with an empty identities array.
      const user: any = (result as any)?.user;
      if (user && Array.isArray(user.identities) && user.identities.length === 0) {
        setFormError('Email ini sudah terdaftar. Coba masuk, atau gunakan "Lupa password".');
        return;
      }
      router.push({ pathname: '/(auth)/verify', params: { email: data.email } });
    } catch (error: any) {
      setFormError(friendlyAuthError(error?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errs: any) => {
    setFormError(
      errs?.email?.message ||
      errs?.password?.message ||
      errs?.confirmPassword?.message ||
      'Periksa kembali isian kamu.',
    );
  };

  return (
    <View style={styles.root}>
      <GradientBackdrop blobOpacity={0.85} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Text style={styles.wordmark}>almamatcher</Text>
            <Text style={styles.tagline}>Khusus mahasiswa aktif Indonesia</Text>
          </View>

          <GlassView tone="light" radius={Radii.xxl} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.eyebrow}>BUAT AKUN</Text>
              <Text style={styles.cardTitle}>Daftar</Text>
            </View>

            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                Hanya email kampus berakhiran <Text style={styles.infoBold}>.ac.id</Text> yang bisa mendaftar.
              </Text>
            </View>

            {formError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Kampus</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="nama@student.univ.ac.id"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Minimal 8 karakter"
                      placeholderTextColor={Colors.textTertiary}
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                      <Text style={styles.passwordToggleText}>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Ulangi password"
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
                </View>
              )}
            />

            {/* Privacy consent checkbox — required for UU PDP compliance */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setConsentChecked((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                {consentChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.consentText}>
                Saya telah membaca dan menyetujui{' '}
                <Text
                  style={styles.consentLink}
                  onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })}
                >
                  Kebijakan Privasi
                </Text>
                {' '}dan{' '}
                <Text
                  style={styles.consentLink}
                  onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}
                >
                  Syarat & Ketentuan
                </Text>
                {' '}AlmaMatcher.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit, onError)}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.btnPrimaryWrap, isLoading && styles.btnDisabled]}
            >
              <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnPrimary}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Daftar Sekarang</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </GlassView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundWarm },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: 40, gap: Spacing.xl,
  },
  brand: { alignItems: 'center', gap: 7 },
  wordmark: { fontFamily: Fonts.display.extrabold, fontSize: 32, color: Colors.textPrimary, letterSpacing: -1.4 },
  tagline: { fontFamily: Fonts.sans.regular, fontSize: 13.5, color: 'rgba(28,25,23,0.5)', textAlign: 'center' },

  card: { padding: Spacing.xxl, gap: Spacing.md, ...Shadows.lg },
  cardHead: { gap: 4, marginBottom: Spacing.xs },
  eyebrow: { fontFamily: Fonts.sans.bold, fontSize: 10.5, color: Colors.primary, letterSpacing: 2 },
  cardTitle: { fontFamily: Fonts.display.extrabold, fontSize: 27, color: Colors.textPrimary, letterSpacing: -0.6 },

  infoNote: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  infoNoteText: { fontFamily: Fonts.sans.regular, fontSize: 12.5, color: Colors.secondaryHover, lineHeight: 17 },
  infoBold: { fontFamily: Fonts.sans.bold, color: Colors.secondaryHover },

  errorBanner: {
    backgroundColor: 'rgba(226,84,91,0.1)',
    borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11,
  },
  errorBannerText: { fontFamily: Fonts.sans.medium, fontSize: 13, color: Colors.error, lineHeight: 18 },

  fieldGroup: { gap: 7 },
  fieldLabel: {
    fontFamily: Fonts.sans.semibold, fontSize: 11, color: 'rgba(28,25,23,0.45)',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: 15, fontFamily: Fonts.sans.regular, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  errorText: { fontFamily: Fonts.sans.medium, fontSize: 12, color: Colors.error },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 104 },
  passwordToggle: { position: 'absolute', right: Spacing.lg, top: 0, bottom: 0, justifyContent: 'center' },
  passwordToggleText: { fontFamily: Fonts.sans.semibold, fontSize: 12, color: Colors.primaryHover },

  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontFamily: Fonts.sans.bold },
  consentText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.sans.regular, color: Colors.textSecondary, lineHeight: 18 },
  consentLink: { fontFamily: Fonts.sans.bold, color: Colors.primaryHover },

  btnPrimaryWrap: { borderRadius: Radii.full, marginTop: Spacing.xs, ...Shadows.primary },
  btnPrimary: { borderRadius: Radii.full, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { fontFamily: Fonts.sans.bold, color: '#fff', fontSize: 16, letterSpacing: 0.3 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: Fonts.sans.regular, fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontFamily: Fonts.sans.bold, fontSize: 14, color: Colors.primaryHover },
});
