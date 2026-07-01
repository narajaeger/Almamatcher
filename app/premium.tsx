// app/premium.tsx — Upgrade to Premium (themed, glass, gradient CTA)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Platform, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useProfileStore } from '../stores/profileStore';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../constants/theme';
import ScreenGradient from '../components/ui/ScreenGradient';
import GlassView from '../components/ui/GlassView';
import Icon, { type IconName } from '../components/ui/Icon';
import PressableScale from '../components/ui/PressableScale';

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'heartFill', title: 'Lihat Siapa yang Suka Kamu', desc: 'Akses penuh daftar orang yang sudah suka profilmu — langsung match tanpa nunggu.' },
  { icon: 'bolt', title: 'Super Crush', desc: 'Kirim suka spesial biar profilmu menonjol & lebih diprioritaskan.' },
  { icon: 'arrowRight', title: 'Rewind Swipe', desc: 'Salah geser? Tarik kembali profil terakhir kapan saja.' },
  { icon: 'book', title: 'Belajar Tanpa Batas Waktu', desc: 'Timer study tidak dibatasi 30 menit per hari. Fokus sepuasnya.' },
  { icon: 'search', title: 'Filter Pencarian Lanjutan', desc: 'Saring berdasarkan universitas, jurusan, usia, dan lainnya.' },
  { icon: 'sparkles', title: 'Prioritas di Temukan', desc: 'Profilmu muncul lebih sering & lebih atas di layar orang lain.' },
  { icon: 'chat', title: 'Chat Tanpa Batas', desc: 'Kirim pesan sebanyak-banyaknya tanpa pembatasan harian.' },
  { icon: 'ban', title: 'Tanpa Iklan', desc: 'Nikmati AlmaMatcher bebas dari gangguan iklan.' },
];

// Free vs Premium — supaya bedanya jelas
const COMPARE: { label: string; free: string; premium: string }[] = [
  { label: 'Lihat yang suka kamu', free: '—', premium: 'Penuh' },
  { label: 'Timer belajar', free: '30 mnt/hari', premium: 'Tanpa batas' },
  { label: 'Filter universitas & prodi', free: 'Dasar', premium: 'Lengkap' },
  { label: 'Posting komunitas', free: '5 / hari', premium: 'Tanpa batas' },
  { label: 'Prioritas di Temukan', free: '—', premium: 'Ya' },
  { label: 'Iklan', free: 'Ada', premium: 'Tidak ada' },
];

const PLANS = [
  { id: 'monthly', label: '1 Bulan', price: 'Rp 24.000', period: '/bulan', badge: null, priceVal: 24000 },
  { id: 'quarterly', label: '3 Bulan', price: 'Rp 64.000', period: '/3 bulan', badge: 'HEMAT 11%', priceVal: 64000 },
  { id: 'yearly', label: '12 Bulan', price: 'Rp 199.000', period: '/tahun', badge: 'HEMAT 31%', priceVal: 199000 },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [returnedStatus, setReturnedStatus] = useState<'success' | 'cancel' | null>(null);

  // After returning from the iPaymu page (web), reflect ?status=… and poll the
  // profile a few times until the callback marks the account premium.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const status = new URLSearchParams(window.location.search).get('status');
    if (status === 'success' || status === 'cancel') {
      setReturnedStatus(status as 'success' | 'cancel');
      if (status === 'success') {
        let tries = 0;
        const t = setInterval(async () => {
          tries += 1;
          await fetchProfile();
          if (useProfileStore.getState().profile?.is_premium || tries >= 6) clearInterval(t);
        }, 2500);
        return () => clearInterval(t);
      }
    }
  }, [fetchProfile]);

  const handleUpgrade = useCallback(async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ipaymu-create-payment', {
        body: { plan: selectedPlan },
      });
      if (error || !data?.url) {
        setErrorMsg('Gagal memulai pembayaran. Pastikan koneksi internet stabil dan coba lagi.');
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = data.url as string;
      } else {
        await Linking.openURL(data.url as string);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat menghubungi server pembayaran. Coba lagi sebentar ya.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan]);

  if (profile?.is_premium) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenGradient glowColor={Colors.goldLight} />
        <View style={styles.center}>
          <View style={styles.crownRing}><Icon name="crown" size={44} color={Colors.gold} /></View>
          <Text style={styles.alreadyTitle}>Kamu sudah Premium!</Text>
          <Text style={styles.alreadyDesc}>Semua fitur sudah terbuka untukmu.</Text>
          <TouchableOpacity style={styles.backCta} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backCtaText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={Colors.goldLight} />

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <GlassView tone="light" radius={Radii.full} style={styles.closeInner}>
          <Icon name="close" size={18} color={Colors.textSecondary} weight={2.2} />
        </GlassView>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={Gradients.romance} style={styles.crownBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icon name="crown" size={34} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroTitle}>AlmaMatcher Premium</Text>
          <Text style={styles.heroSub}>Temukan jodoh & study partner tanpa batas</Text>
        </View>

        {returnedStatus === 'success' && (
          <View style={styles.noticeOk}>
            <Text style={styles.noticeOkText}>
              Pembayaran diterima 🎉 Status Premium kamu sedang diaktifkan — mohon tunggu beberapa detik.
            </Text>
          </View>
        )}
        {returnedStatus === 'cancel' && (
          <View style={styles.noticeWarn}>
            <Text style={styles.noticeWarnText}>Pembayaran dibatalkan. Kamu bisa coba lagi kapan saja.</Text>
          </View>
        )}

        {/* Free vs Premium */}
        <Text style={styles.plansTitle}>Gratis vs Premium</Text>
        <GlassView tone="light" radius={Radii.xl} style={styles.compareCard}>
          <View style={[styles.compareRow, styles.compareHead]}>
            <Text style={[styles.compareCell, styles.compareLabelHead]}>Fitur</Text>
            <Text style={[styles.compareCell, styles.compareColHead]}>Gratis</Text>
            <Text style={[styles.compareCell, styles.compareColHeadPro]}>Premium</Text>
          </View>
          {COMPARE.map((c, i) => (
            <View key={i} style={[styles.compareRow, i < COMPARE.length - 1 && styles.compareDivider]}>
              <Text style={[styles.compareCell, styles.compareLabel]}>{c.label}</Text>
              <Text style={[styles.compareCell, styles.compareFree]}>{c.free}</Text>
              <Text style={[styles.compareCell, styles.comparePro]}>{c.premium}</Text>
            </View>
          ))}
        </GlassView>

        {/* Features */}
        <GlassView tone="light" radius={Radii.xl} style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureDivider]}>
              <View style={styles.featureIcon}>
                <Icon name={f.icon} size={20} color={Colors.primary} weight={2.2} fill={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </GlassView>

        {/* Plans */}
        <Text style={styles.plansTitle}>Pilih Paket</Text>
        <View style={styles.plans}>
          {PLANS.map(p => {
            const active = selectedPlan === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.planCard, active && styles.planCardActive]}
                onPress={() => setSelectedPlan(p.id)}
                activeOpacity={0.85}
              >
                {p.badge && (
                  <View style={[styles.planBadge, active && styles.planBadgeActive]}>
                    <Text style={[styles.planBadgeText, active && { color: '#fff' }]}>{p.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, active && { color: Colors.primary }]}>{p.label}</Text>
                <Text style={[styles.planPrice, active && { color: Colors.primaryHover }]}>{p.price}</Text>
                <Text style={[styles.planPeriod, active && { color: Colors.primary }]}>{p.period}</Text>
                {active && (
                  <View style={styles.checkCircle}><Icon name="check" size={11} color="#fff" weight={3} /></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* CTA */}
        <PressableScale
          onPress={handleUpgrade}
          disabled={isLoading}
          style={styles.ctaWrap}
          accessibilityLabel={`Upgrade Premium ${plan.price}${plan.period}`}
        >
          <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBtn}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.ctaText}>Upgrade Sekarang</Text>
                <Text style={styles.ctaSub}>{plan.price}{plan.period}</Text>
              </>
            )}
          </LinearGradient>
        </PressableScale>

        <Text style={styles.disclaimer}>Pembayaran diproses aman lewat iPaymu (transfer bank, e-wallet, QRIS, dll). Premium aktif otomatis setelah pembayaran berhasil.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  closeBtn: { position: 'absolute', top: 52, right: Spacing.xl, zIndex: 10 },
  closeInner: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 48, paddingTop: 24 },

  hero: { alignItems: 'center', paddingVertical: 24 },
  crownBadge: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  heroTitle: { fontSize: 28, fontFamily: Fonts.display.extrabold, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.6 },
  heroSub: { fontSize: 14.5, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, textAlign: 'center', marginTop: 6, maxWidth: 280 },

  noticeOk: {
    backgroundColor: 'rgba(46,160,107,0.12)', borderWidth: 1, borderColor: 'rgba(46,160,107,0.35)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11, marginBottom: 8,
  },
  noticeOkText: { fontSize: 13, color: '#1f7a52', fontFamily: Fonts.sans.medium, lineHeight: 18 },
  noticeWarn: {
    backgroundColor: 'rgba(214,158,46,0.12)', borderWidth: 1, borderColor: 'rgba(214,158,46,0.35)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11, marginBottom: 8,
  },
  noticeWarnText: { fontSize: 13, color: '#9a6b12', fontFamily: Fonts.sans.medium, lineHeight: 18 },
  errorBanner: {
    backgroundColor: 'rgba(226,84,91,0.1)', borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11, marginBottom: 12,
  },
  errorBannerText: { fontSize: 13, color: Colors.error, fontFamily: Fonts.sans.medium, lineHeight: 18 },

  // Compare table
  compareCard: { paddingVertical: 4, paddingHorizontal: 4, marginBottom: 20 },
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10 },
  compareHead: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  compareDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  compareCell: { fontSize: 13, fontFamily: Fonts.sans.regular, textAlign: 'center' },
  compareLabel: { flex: 1.5, textAlign: 'left', color: Colors.textSecondary },
  compareLabelHead: { flex: 1.5, textAlign: 'left', color: Colors.textTertiary, fontFamily: Fonts.sans.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  compareColHead: { flex: 1, color: Colors.textTertiary, fontFamily: Fonts.sans.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  compareColHeadPro: { flex: 1, color: Colors.primary, fontFamily: Fonts.sans.extrabold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  compareFree: { flex: 1, color: Colors.textTertiary },
  comparePro: { flex: 1, color: Colors.primaryHover, fontFamily: Fonts.sans.bold },

  featuresCard: { padding: 4, marginVertical: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  featureDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  featureIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14.5, fontFamily: Fonts.sans.bold, color: Colors.textPrimary },
  featureDesc: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, marginTop: 2, lineHeight: 18 },

  plansTitle: { fontSize: 17, fontFamily: Fonts.display.bold, color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  plans: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  planCard: {
    flex: 1, borderRadius: Radii.lg, padding: 14,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  planBadge: { backgroundColor: Colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  planBadgeActive: { backgroundColor: Colors.primary },
  planBadgeText: { fontSize: 9, fontFamily: Fonts.sans.extrabold, color: Colors.textSecondary, letterSpacing: 0.5 },
  planLabel: { fontSize: 12, fontFamily: Fonts.sans.semibold, color: Colors.textSecondary, marginBottom: 6 },
  planPrice: { fontSize: 16, fontFamily: Fonts.sans.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  planPeriod: { fontSize: 11, color: Colors.textTertiary, fontFamily: Fonts.sans.regular, marginTop: 2 },
  checkCircle: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  ctaWrap: { borderRadius: Radii.full, ...Shadows.primary },
  ctaBtn: { borderRadius: Radii.full, paddingVertical: 17, alignItems: 'center' },
  ctaText: { color: '#FFF', fontSize: 17, fontFamily: Fonts.sans.extrabold },
  ctaSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: Fonts.sans.medium, marginTop: 2 },
  disclaimer: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.regular, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  crownRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.goldLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.gold + '55',
  },
  alreadyTitle: { fontSize: 23, fontFamily: Fonts.display.extrabold, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  alreadyDesc: { fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, textAlign: 'center', marginTop: 8 },
  backCta: { marginTop: 28, backgroundColor: Colors.primary, borderRadius: Radii.full, paddingHorizontal: 32, paddingVertical: 14, ...Shadows.primary },
  backCtaText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.sans.bold },
});
