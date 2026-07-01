// app/(auth)/login.tsx
// Redesign: animated gradient backdrop + 2D couple animation + liquid-glass form.
// Fonts: Sora (display) / Plus Jakarta Sans (body). Accents: coral + teal on beige.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmail, friendlyAuthError } from '../../services/authService';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../../constants/theme';
import GradientBackdrop from '../../components/ui/GradientBackdrop';
import GlassView from '../../components/ui/GlassView';
import CoupleAnimation from '../../components/auth/CoupleAnimation';

const loginSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .refine((val) => val.endsWith('.ac.id'), {
      message: 'Harus menggunakan email kampus (.ac.id)',
    }),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    setNoAccount(false);
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
    } catch (error: any) {
      const msg = friendlyAuthError(error?.message);
      setFormError(msg);
      // If credentials are invalid, the person may simply not have an account yet
      if (/invalid login|invalid credentials/i.test(error?.message ?? '')) {
        setNoAccount(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onError = () => setFormError('Periksa kembali email dan password kamu.');

  return (
    <View style={styles.root}>
      <GradientBackdrop blobOpacity={0.9} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero animation ── */}
          <CoupleAnimation />

          {/* ── Brand ── */}
          <View style={styles.brand}>
            <Text style={styles.wordmark}>almamatcher</Text>
            <Text style={styles.tagline}>Temukan koneksi yang tepat di kampusmu</Text>
          </View>

          {/* ── Glass form card ── */}
          <GlassView tone="light" radius={Radii.xxl} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.eyebrow}>SELAMAT DATANG</Text>
              <Text style={styles.cardTitle}>Masuk</Text>
            </View>

            {formError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
                {noAccount && (
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
                    <Text style={styles.errorBannerLink}>Belum punya akun? Daftar sekarang →</Text>
                  </TouchableOpacity>
                )}
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
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
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
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword((v) => !v)}
                    >
                      <Text style={styles.passwordToggleText}>
                        {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Lupa password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit, onError)}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.btnPrimaryWrap, isLoading && styles.btnDisabled]}
            >
              <LinearGradient
                colors={Gradients.coral}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimary}
              >
                {isLoading
                  ? <ActivityIndicator color={Colors.textInverse} />
                  : <Text style={styles.btnPrimaryText}>Masuk</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </GlassView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Daftar sekarang</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 40,
    gap: Spacing.xl,
  },

  brand: {
    alignItems: 'center',
    gap: 7,
    marginTop: -4,
  },
  wordmark: {
    fontFamily: Fonts.display.extrabold,
    fontSize: 36,
    color: Colors.textPrimary,
    letterSpacing: -1.6,
  },
  tagline: {
    fontFamily: Fonts.sans.regular,
    fontSize: 13.5,
    color: 'rgba(28,25,23,0.5)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },

  card: {
    padding: Spacing.xxl,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  cardHead: { gap: 4, marginBottom: Spacing.sm },
  eyebrow: {
    fontFamily: Fonts.sans.bold,
    fontSize: 10.5,
    color: Colors.primary,
    letterSpacing: 2,
  },
  cardTitle: {
    fontFamily: Fonts.display.extrabold,
    fontSize: 27,
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  errorBanner: {
    backgroundColor: 'rgba(226,84,91,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    gap: 6,
  },
  errorBannerText: {
    fontFamily: Fonts.sans.medium,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  errorBannerLink: {
    fontFamily: Fonts.sans.bold,
    fontSize: 13,
    color: Colors.primaryHover,
  },
  fieldGroup: { gap: 7 },
  fieldLabel: {
    fontFamily: Fonts.sans.semibold,
    fontSize: 11,
    color: 'rgba(28,25,23,0.45)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Fonts.sans.regular,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  errorText: {
    fontFamily: Fonts.sans.medium,
    fontSize: 12,
    color: Colors.error,
    marginTop: 2,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 104 },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.lg,
    top: 0, bottom: 0,
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontFamily: Fonts.sans.semibold,
    fontSize: 12,
    color: Colors.primaryHover,
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: {
    fontFamily: Fonts.sans.semibold,
    fontSize: 13,
    color: Colors.primaryHover,
  },

  btnPrimaryWrap: {
    borderRadius: Radii.full,
    marginTop: Spacing.xs,
    ...Shadows.primary,
  },
  btnPrimary: {
    borderRadius: Radii.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: {
    fontFamily: Fonts.sans.bold,
    color: Colors.textInverse,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.sans.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: Fonts.sans.bold,
    fontSize: 14,
    color: Colors.primaryHover,
  },
});
// end login.tsx
