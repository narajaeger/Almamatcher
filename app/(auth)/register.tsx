import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpWithEmail } from '../../services/authService';

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

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      router.push({
        pathname: '/(auth)/verify',
        params: { email: data.email },
      });
    } catch (error: any) {
      Alert.alert('Registrasi Gagal', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>💘 Almamatcher</Text>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Khusus mahasiswa aktif Indonesia 🇮🇩
          </Text>
        </View>

        {/* Info Badge */}
        <View style={styles.infoBadge}>
          <Text style={styles.infoText}>
            📧 Hanya email berakhiran <Text style={styles.bold}>.ac.id</Text> yang diterima
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Kampus (.ac.id)</Text>
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Ulangi password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
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
              : <Text style={styles.btnText}>Daftar Sekarang</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.back()}
          >
            <Text style={styles.btnSecondaryText}>
              Sudah punya akun?{' '}
              <Text style={styles.linkText}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: '#FF6B9D', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center' },
  infoBadge: {
    backgroundColor: '#1A1A2E', borderWidth: 1,
    borderColor: '#FF6B9D33', borderRadius: 10,
    padding: 12, marginBottom: 20,
  },
  infoText: { color: '#AAA', fontSize: 13, textAlign: 'center' },
  bold: { fontWeight: '700', color: '#FF6B9D' },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#CCC' },
  input: {
    backgroundColor: '#1E1E2E', borderWidth: 1,
    borderColor: '#2E2E3E', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#FFF',
  },
  inputError: { borderColor: '#FF4D6D' },
  errorText: { fontSize: 12, color: '#FF4D6D' },
  btnPrimary: {
    backgroundColor: '#FF6B9D', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: { alignItems: 'center', paddingVertical: 8 },
  btnSecondaryText: { color: '#888', fontSize: 14 },
  linkText: { color: '#FF6B9D', fontWeight: '600' },
});