import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmail } from '../../services/authService';

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

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      // _layout.tsx akan handle redirect otomatis
    } catch (error: any) {
      Alert.alert('Login Gagal', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💘 Almamatcher</Text>
          <Text style={styles.subtitle}>
            Dating & Study App khusus Mahasiswa Indonesia
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Kampus</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="nama@student.univ.ac.id"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Masuk</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.btnSecondaryText}>
              Belum punya akun?{' '}
              <Text style={styles.linkText}>Daftar Sekarang</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  inner: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 32,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: '800', color: '#FF6B9D', marginBottom: 8 },
  subtitle: {
    fontSize: 14, color: '#888',
    textAlign: 'center', lineHeight: 20,
  },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#CCC' },
  input: {
    backgroundColor: '#1E1E2E',
    borderWidth: 1, borderColor: '#2E2E3E',
    borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#FFF',
  },
  inputError: { borderColor: '#FF4D6D' },
  errorText: { fontSize: 12, color: '#FF4D6D' },
  btnPrimary: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: { alignItems: 'center', paddingVertical: 8 },
  btnSecondaryText: { color: '#888', fontSize: 14 },
  linkText: { color: '#FF6B9D', fontWeight: '600' },
});