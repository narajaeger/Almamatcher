// app/legal/[doc].tsx
// Placeholder pages: Kebijakan Privasi, Syarat & Ketentuan, Hubungi Kami.
// Satu file, kontennya ditentukan oleh param `doc` (privacy | terms | contact).

import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Radii, Spacing, Fonts } from '../../constants/theme';
import ScreenGradient from '../../components/ui/ScreenGradient';
import Icon from '../../components/ui/Icon';

type Doc = 'privacy' | 'terms' | 'contact';

interface Block { heading?: string; body: string; }
interface Content { title: string; updated?: string; intro: string; blocks: Block[]; }

const CONTENT: Record<Doc, Content> = {
  privacy: {
    title: 'Kebijakan Privasi',
    updated: 'Terakhir diperbarui: 28 Juni 2026 · Versi 1.0',
    intro:
      'Kebijakan Privasi ini menjelaskan bagaimana AlmaMatcher ("kami", "aplikasi") mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi kamu sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) Republik Indonesia. Dengan mendaftar dan menggunakan AlmaMatcher, kamu menyatakan telah membaca dan menyetujui kebijakan ini.',
    blocks: [
      {
        heading: '1. Identitas Pengendali Data',
        body: 'AlmaMatcher dikelola oleh tim pengembang AlmaMatcher, berdomisili di Indonesia. Untuk pertanyaan terkait privasi, hubungi kami di: admin@almamatcher.id',
      },
      {
        heading: '2. Data Pribadi yang Kami Kumpulkan',
        body: 'a) Data akun: alamat email kampus (.ac.id), kata sandi terenkripsi.\n\nb) Data profil: nama lengkap, nama pengguna, foto profil, universitas, fakultas, program studi, angkatan, tanggal lahir, jenis kelamin, kota asal, bio.\n\nc) Data pribadi sensitif (bersifat opsional, hanya dikumpulkan atas persetujuanmu): agama, tinggi badan, berat badan, tipe kepribadian MBTI.\n\nd) Data aktivitas: daftar suka (like), kecocokan (match), pesan, postingan komunitas, sesi belajar, ruang belajar yang diikuti.\n\ne) Data teknis: token notifikasi push, waktu pemberian persetujuan (consent), versi kebijakan yang disetujui.',
      },
      {
        heading: '3. Tujuan dan Dasar Hukum Pemrosesan',
        body: 'Kami memproses data pribadimu untuk tujuan berikut:\n\n• Menjalankan layanan utama aplikasi (mempertemukan mahasiswa, fitur chat, study room) — dasar hukum: pelaksanaan perjanjian.\n\n• Menampilkan profilmu kepada pengguna lain yang telah login — dasar hukum: persetujuan (consent) yang kamu berikan saat mendaftar.\n\n• Mengirimkan notifikasi pesan baru — dasar hukum: persetujuan.\n\n• Meningkatkan keamanan dan mencegah penyalahgunaan — dasar hukum: kepentingan sah kami.\n\n• Mematuhi kewajiban hukum yang berlaku — dasar hukum: kewajiban hukum.\n\nKami tidak menjual, menyewakan, atau memperdagangkan data pribadimu kepada pihak ketiga untuk tujuan pemasaran.',
      },
      {
        heading: '4. Data Pribadi Sensitif',
        body: 'Informasi agama, tinggi badan, berat badan, dan MBTI bersifat sepenuhnya opsional. Kamu dapat mengosongkan kolom-kolom ini saat mengisi profil. Jika kamu memilih untuk mengisinya, data tersebut akan ditampilkan kepada pengguna lain yang sudah login di dalam aplikasi sesuai dengan tujuan layanan. Kamu dapat mengubah atau menghapus data ini kapan saja melalui menu Edit Profil.',
      },
      {
        heading: '5. Pihak Ketiga yang Menerima Data',
        body: 'Kami menggunakan layanan pihak ketiga berikut untuk menjalankan operasional aplikasi:\n\n• Supabase (supabase.com) — penyimpanan database dan file, berlokasi di Singapura. Data yang disimpan mencakup seluruh data profil dan aktivitas.\n\n• Expo (expo.dev) — pengiriman notifikasi push. Token notifikasimu dikirim ke server Expo yang berlokasi di Amerika Serikat.\n\n• Netlify (netlify.com) — hosting versi web aplikasi, berlokasi di Amerika Serikat.\n\nSeluruh penyedia layanan di atas terikat perjanjian pemrosesan data dan wajib menjaga kerahasiaan datamu.',
      },
      {
        heading: '6. Transfer Data Lintas Negara',
        body: 'Sebagian data pribadimu diproses di luar wilayah Indonesia (Singapura dan Amerika Serikat) melalui layanan pihak ketiga yang kami gunakan (lihat Pasal 5). Transfer ini dilakukan berdasarkan persetujuanmu dan dengan memastikan pihak penerima memiliki standar pelindungan data yang memadai sesuai ketentuan UU PDP.',
      },
      {
        heading: '7. Jangka Waktu Penyimpanan Data',
        body: '• Data akun dan profil disimpan selama akunmu aktif.\n\n• Pesan (chat) disimpan selama kedua pihak masih terhubung (matched). Pesan dihapus otomatis saat terjadi unmatch atau salah satu pihak menghapus akun.\n\n• Postingan komunitas disimpan hingga kamu menghapusnya sendiri atau akun dihapus.\n\n• Sesi belajar disimpan selama 12 bulan untuk keperluan statistik, kemudian dianonimkan.\n\n• Ketika kamu menghapus akun, seluruh data pribadimu dihapus permanen dari sistem kami dalam waktu maksimal 30 hari.',
      },
      {
        heading: '8. Keamanan Data',
        body: 'Kami menerapkan langkah-langkah teknis untuk melindungi datamu, antara lain:\n\n• Enkripsi data saat transit (HTTPS/TLS).\n\n• Row Level Security (RLS) di database — setiap pengguna hanya dapat mengakses data miliknya sendiri.\n\n• Kata sandi dienkripsi menggunakan bcrypt oleh Supabase Auth dan tidak pernah disimpan dalam bentuk teks biasa.\n\n• Autentikasi berbasis token JWT dengan masa berlaku terbatas.\n\nMeskipun demikian, tidak ada sistem yang 100% aman. Jika terjadi pelanggaran keamanan yang berdampak pada datamu, kami akan memberitahumu sesuai ketentuan yang berlaku.',
      },
      {
        heading: '9. Hak-Hak Kamu sebagai Subjek Data',
        body: 'Sesuai UU PDP Pasal 5–16, kamu berhak untuk:\n\n• Mengakses — melihat data pribadi apa saja yang kami simpan tentang kamu.\n\n• Memperbaiki — memperbarui data yang tidak akurat melalui menu Edit Profil.\n\n• Menghapus — menghapus akunmu beserta seluruh data terkait melalui Pengaturan → Hapus Akun.\n\n• Menarik persetujuan — mencabut consent kapan saja (namun hal ini akan mengakhiri akses ke layanan).\n\n• Keberatan — mengajukan keberatan atas pemrosesan tertentu.\n\n• Portabilitas — meminta salinan data pribadimu dalam format yang dapat dibaca mesin.\n\nUntuk menggunakan hak-hak di atas, hubungi kami di admin@almamatcher.id. Kami akan merespons dalam 14 hari kerja.',
      },
      {
        heading: '10. Privasi Anak dan Remaja',
        body: 'AlmaMatcher ditujukan untuk mahasiswa aktif berusia 17 tahun ke atas. Kami tidak secara sengaja mengumpulkan data dari individu di bawah usia 17 tahun. Jika kamu menduga ada pengguna di bawah umur, harap laporkan kepada kami.',
      },
      {
        heading: '11. Perubahan Kebijakan',
        body: 'Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui notifikasi di aplikasi atau email. Tanggal pembaruan terakhir selalu tercantum di bagian atas halaman ini. Penggunaan aplikasi yang dilanjutkan setelah pemberitahuan dianggap sebagai persetujuan atas perubahan tersebut.',
      },
      {
        heading: '12. Pengaduan',
        body: 'Jika kamu merasa hak privasimu dilanggar dan kami tidak merespons dengan memadai, kamu berhak mengajukan pengaduan kepada Lembaga Pelindungan Data Pribadi yang berwenang di Indonesia sesuai ketentuan UU PDP.',
      },
    ],
  },
  terms: {
    title: 'Syarat & Ketentuan',
    updated: 'Terakhir diperbarui: 28 Juni 2026 · Versi 1.0',
    intro:
      'Syarat & Ketentuan ini mengatur penggunaan aplikasi AlmaMatcher. Dengan mendaftar atau menggunakan layanan kami, kamu menyatakan telah membaca, memahami, dan menyetujui ketentuan ini secara keseluruhan.',
    blocks: [
      {
        heading: '1. Kelayakan Pengguna',
        body: 'AlmaMatcher hanya terbuka untuk:\n\n• Mahasiswa aktif perguruan tinggi di Indonesia dengan email kampus berakhiran .ac.id.\n\n• Berusia minimal 17 tahun.\n\nDengan mendaftar, kamu menyatakan bahwa informasi yang kamu berikan benar dan akurat. Kami berhak menonaktifkan akun yang terbukti menggunakan identitas palsu.',
      },
      {
        heading: '2. Akun dan Keamanan',
        body: 'Kamu bertanggung jawab penuh atas kerahasiaan kata sandimu dan seluruh aktivitas yang terjadi di akunmu. Segera hubungi kami jika kamu mencurigai adanya akses tidak sah. Jangan berbagi akun dengan orang lain.',
      },
      {
        heading: '3. Perilaku Pengguna',
        body: 'Kamu dilarang keras:\n\n• Melakukan pelecehan, intimidasi, atau ancaman kepada pengguna lain.\n\n• Mengunggah konten pornografi, kekerasan, atau yang melanggar hukum Indonesia.\n\n• Menyebarkan informasi palsu atau menyesatkan (hoaks).\n\n• Menggunakan aplikasi untuk spam, penipuan, atau aktivitas komersial tanpa izin.\n\n• Meniru identitas orang lain atau membuat profil palsu.\n\n• Melakukan scraping, reverse engineering, atau mengakses sistem kami di luar batas yang diizinkan.\n\nPelanggaran dapat berakibat penangguhan atau penghapusan akun permanen tanpa pemberitahuan.',
      },
      {
        heading: '4. Konten yang Kamu Unggah',
        body: 'Kamu mempertahankan hak kepemilikan atas konten yang kamu unggah (foto, bio, postingan). Namun, dengan mengunggahnya kamu memberikan kami lisensi terbatas untuk menampilkan konten tersebut kepada pengguna lain dalam rangka menjalankan layanan.\n\nKamu menjamin bahwa konten yang kamu unggah tidak melanggar hak pihak ketiga manapun dan tidak melanggar hukum yang berlaku.',
      },
      {
        heading: '5. Fitur Match dan Chat',
        body: 'Fitur match dan chat hanya tersedia antara dua pengguna yang saling menyukai (mutual like). Pesan antara kedua pihak akan dihapus otomatis jika terjadi unmatch. AlmaMatcher tidak bertanggung jawab atas interaksi yang terjadi di luar platform.',
      },
      {
        heading: '6. Langganan Premium',
        body: 'Fitur Premium memberikan akses tambahan seperti unlimited posting komunitas dan study session tanpa batas waktu. Harga dan ketentuan langganan ditampilkan sebelum pembelian. Pembayaran diproses melalui gateway pembayaran yang aman. Kami tidak menyimpan data kartu kreditmu.',
      },
      {
        heading: '7. Penghentian Layanan',
        body: 'Kamu dapat menghapus akunmu kapan saja melalui Pengaturan → Hapus Akun. Kami berhak menangguhkan atau menghentikan layanan kepada pengguna yang melanggar Syarat & Ketentuan ini.',
      },
      {
        heading: '8. Batasan Tanggung Jawab',
        body: 'AlmaMatcher disediakan "sebagaimana adanya". Kami tidak menjamin bahwa layanan akan selalu tersedia tanpa gangguan. Kami tidak bertanggung jawab atas kerugian yang timbul dari interaksi antar pengguna di luar platform, atau dari gangguan teknis yang berada di luar kendali kami.',
      },
      {
        heading: '9. Hukum yang Berlaku',
        body: 'Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul diselesaikan melalui musyawarah. Jika tidak tercapai kesepakatan, penyelesaian dilakukan melalui pengadilan yang berwenang di Indonesia.',
      },
      {
        heading: '10. Perubahan Ketentuan',
        body: 'Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan material akan diberitahukan melalui notifikasi di aplikasi minimal 7 hari sebelum berlaku. Penggunaan aplikasi yang dilanjutkan setelah tanggal efektif perubahan dianggap sebagai persetujuan.',
      },
    ],
  },
  contact: {
    title: 'Hubungi Kami',
    intro:
      'Ada pertanyaan, laporan bug, atau masukan untuk AlmaMatcher? Tim kami siap membantu.',
    blocks: [
      {
        heading: 'Email',
        body: 'admin@almamatcher.id\nUntuk pertanyaan umum, laporan bug, masukan fitur, serta permintaan akses/penghapusan data dan pertanyaan terkait Kebijakan Privasi dan UU PDP.',
      },
      {
        heading: 'Instagram',
        body: '@almamatcher.id\nUpdate terbaru, pengumuman fitur, dan konten komunitas.',
      },
      {
        heading: 'Jam Respons',
        body: 'Senin–Jumat, 09.00–17.00 WIB.\nKami biasanya membalas dalam 1–2 hari kerja. Untuk laporan darurat terkait keamanan atau pelecehan, kami berusaha merespons dalam 24 jam.',
      },
    ],
  },
};

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const key: Doc = (['privacy', 'terms', 'contact'] as Doc[]).includes(doc as Doc)
    ? (doc as Doc)
    : 'privacy';
  const data = CONTENT[key];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data.updated ? <Text style={styles.updated}>{data.updated}</Text> : null}
        <Text style={styles.intro}>{data.intro}</Text>

        {data.blocks.map((b, i) => (
          <View key={i} style={styles.block}>
            {b.heading ? <Text style={styles.heading}>{b.heading}</Text> : null}
            <Text style={styles.body}>{b.body}</Text>
          </View>
        ))}

        {key === 'contact' && (
          <Text style={styles.note}>
            Kamu juga bisa mengirim masukan langsung lewat tombol di bawah ini.
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: Fonts.display.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  content: { padding: Spacing.xl },
  updated: { fontSize: 12, color: Colors.textTertiary, marginBottom: Spacing.md, fontFamily: Fonts.sans.medium },
  intro: { fontSize: 15, color: Colors.textSecondary, lineHeight: 23, marginBottom: Spacing.xl, fontFamily: Fonts.sans.regular },
  block: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radii.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    padding: Spacing.lg, marginBottom: Spacing.md, gap: 6,
  },
  heading: { fontSize: 15, fontFamily: Fonts.sans.bold, color: Colors.textPrimary },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, fontFamily: Fonts.sans.regular },
  note: { fontSize: 13, color: Colors.textTertiary, marginTop: Spacing.sm, fontStyle: Platform.OS === 'web' ? 'normal' : 'italic' },
});
