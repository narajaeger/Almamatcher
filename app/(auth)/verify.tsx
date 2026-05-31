import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resendVerificationEmail } from '../../services/authService';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      Alert.alert('Terkirim!', 'Email verifikasi telah dikirim ulang.');

      // Cooldown 60 detik
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('Gagal', error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>Cek Email Kamu!</Text>
        <Text style={styles.description}>
          Kami sudah mengirim link verifikasi ke:
        </Text>
        <View style={styles.emailBadge}>
          <Text style={styles.emailText}>{email}</Text>
        </View>
        <Text style={styles.hint}>
          Buka emailmu dan klik link verifikasi untuk melanjutkan.
          Jangan lupa cek folder <Text style={styles.bold}>Spam</Text>.
        </Text>

        <TouchableOpacity
          style={[styles.btnResend, (isResending || resendCooldown > 0) && styles.btnDisabled]}
          onPress={handleResend}
          disabled={isResending || resendCooldown > 0}
        >
          {isResending
            ? <ActivityIndicator color="#FF6B9D" />
            : <Text style={styles.btnResendText}>
                {resendCooldown > 0
                  ? `Kirim Ulang (${resendCooldown}s)`
                  : 'Kirim Ulang Email'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backText}>← Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0F0F1A',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { paddingHorizontal: 32, alignItems: 'center', gap: 16 },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  description: { fontSize: 15, color: '#888', textAlign: 'center' },
  emailBadge: {
    backgroundColor: '#1E1E2E', borderWidth: 1,
    borderColor: '#FF6B9D55', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  emailText: { color: '#FF6B9D', fontWeight: '600', fontSize: 15 },
  hint: {
    fontSize: 13, color: '#666',
    textAlign: 'center', lineHeight: 20,
  },
  bold: { color: '#AAA', fontWeight: '700' },
  btnResend: {
    borderWidth: 1.5, borderColor: '#FF6B9D',
    borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 32, marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnResendText: { color: '#FF6B9D', fontSize: 15, fontWeight: '600' },
  backText: { color: '#555', fontSize: 14, marginTop: 8 },
});