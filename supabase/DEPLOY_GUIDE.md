# AlmaMatcher — Supabase Deploy Guide

## 1. SQL Migration (Study Buddy)

Jalankan di **Supabase Dashboard → SQL Editor**:
```
supabase/migrations/20260616_study_buddy.sql
```
File ini sudah idempotent (DROP IF EXISTS → CREATE).

---

## 2. Push Notification Edge Function

### Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### Link ke project
```bash
supabase link --project-ref ekczgiofqbroyufrgizr
```

### Deploy Edge Function
```bash
supabase functions deploy send-push-notification --no-verify-jwt
```

### Set Secret
Di Supabase Dashboard → Settings → Edge Functions → Secrets, tambahkan:
```
SUPABASE_URL=https://ekczgiofqbroyufrgizr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_dari_settings_api>
```

### Setup Database Webhook
Supabase Dashboard → Database → Webhooks → Create Webhook:
- **Name**: `on_message_insert`
- **Table**: `messages`
- **Events**: `INSERT`
- **Type**: Supabase Edge Functions
- **Function**: `send-push-notification`

---

## 3. EAS Build (Android APK / iOS IPA)

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Build preview APK (test di HP)
```bash
eas build --platform android --profile preview
```

### Build production
```bash
eas build --platform all --profile production
```

### Submit ke store
```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

---

## 4. Checklist sebelum release

- [ ] Migration SQL berhasil dijalankan
- [ ] Edge Function ter-deploy dan webhook aktif
- [ ] `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` ada di `.env`
- [ ] `eas.json` diisi `ascAppId` dan `appleTeamId` untuk iOS
- [ ] Google Service Account JSON untuk Play Store
- [ ] Test notifikasi push di device fisik
- [ ] Test premium upgrade flow
