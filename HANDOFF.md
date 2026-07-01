# AlmaMatcher — UI/UX Revamp Handoff

## Goal
Modernize the AlmaMatcher app's look & feel (liquid glass / glassmorphism, dynamic
animation, better typography, complementary colors on the beige base) **and** fix
functional bugs found along the way. App = dating + study-buddy app for students
(email restricted to `.ac.id`).

## Stack (key facts)
- Expo SDK 56, React Native 0.85, expo-router, react-native-web. Supabase backend.
- App files live at `C:\Users\hp\almamatcher`. Web deploys to Netlify.
- Added deps (native → require a dev build; web works in Metro): `expo-blur`,
  `expo-linear-gradient`, `react-native-svg`, `@expo-google-fonts/sora`,
  `@expo-google-fonts/plus-jakarta-sans`.

## Design system (constants/theme.ts)
- Base beige + **coral** `#FF6B6B` (primary) + **teal** (secondary) + **indigo** (study).
- Tokens: `Glass`, `Gradients` (dawn, coral, teal, romance, scrim…), `Shadows`,
  `Fonts` (Sora = display, Plus Jakarta Sans = body), `TAB_SAFE_BOTTOM` (clearance
  above the floating tab bar).
- Fonts loaded via expo-font in `app/_layout.tsx` + a global patch
  `lib/fontPatch.ts` (maps fontWeight/size → Sora for headings, Jakarta for body on native).
- Reusable components: `components/ui/GlassView`, `GradientBackdrop`, `ScreenGradient`,
  `Icon` (custom SVG icon set), `components/auth/CoupleAnimation` (login animation).

## DONE
Screens themed (gradient + glass + Sora/Jakarta + SVG icons + coral/teal):
- Auth: login, register, verify, forgot-password, reset-password.
- Tabs: love/Discover (floating action buttons overlap card), matches, study home,
  chat list, profile.
- Tab bar: SVG icons + real frosted glass; envelope icon on Pesan.
- Detail: chat room, public profile (`app/u/[userId].tsx`), settings, premium,
  onboarding (layout + 5 steps), edit profile, study rooms / create-room / room detail,
  FilterSheet.

Functional fixes:
- Inline error banners everywhere (`Alert` doesn't render on react-native-web).
- Friendly auth error mapper (`friendlyAuthError`); "already registered" detection.
- Email verify/reset redirect → web origin + `detectSessionInUrl` on web.
- Netlify SPA 404-on-refresh → `public/_redirects` + `netlify.toml`.
- Desktop: app constrained to centered ~480px column (`app/+html.tsx`).
- Bottom spacing above floating tab bar on all scroll screens.
- Study buddy "add": surfaces errors, persists state, opens chat after adding.
- Public profile moved to top-level `/u/[userId]` so it no longer hijacks the Profil tab.
- Pesan list = rounded cards, split into **Match** vs **Study Buddy** tabs.
- Footer icon centering attempted (zeroed safe-area padding + icon flex-center).

## USER ACTION ITEMS (outside code)
1. Supabase custom SMTP (Brevo): host `smtp-relay.brevo.com`, port `587`,
   username = Brevo SMTP login (`xxxx@smtp-brevo.com`), password = Brevo **SMTP key**.
2. Supabase → Authentication → URL Configuration: set **Site URL** = Netlify URL and
   add **Redirect URLs**: Netlify URL, `http://localhost:8081`, `almamatcher://`.
   (Required for the verify/reset redirect fix to work.)
3. If "Gagal menambahkan teman belajar" appears → run
   `supabase/migrations/20260616_study_buddy.sql` in Supabase SQL editor.
4. Rebuild dev client for native glass/SVG: `npx expo prebuild` then run on device.
5. Redeploy to Netlify for the 404 fix + desktop-width change.

## NOT DONE (remaining until finish)
1. **Room group chat (NEXT TASK)** — discussion rooms only have a timer + member list.
   Need a shared realtime chatbox. Requires:
   - New Supabase table `room_messages` (room_id, sender_id, content, created_at) with
     RLS (members can read/insert) + add to realtime publication. Provide migration SQL.
   - Service functions (send/get/subscribe) in a new or existing service.
   - Chat UI inside `app/(tabs)/study/room/[roomId].tsx`.
   - NOTE: existing `messages` table is 1-on-1 (match_key), cannot be reused for groups.
2. **Footer vertical centering on mobile** — if still off after reload, build a fully
   custom tab bar via the `tabBar` prop for guaranteed icon centering.
3. Polish: replace remaining emoji icons (premium feature list, some chips) with SVG.
4. Chat room header says "Match kamu" for everyone; a `kind` param ('match'|'buddy') is
   already passed from the chat list and could differentiate the label.

## IMPORTANT CAVEAT FOR NEXT SESSION
The Linux sandbox mount of the project (`/sessions/.../mnt/almamatcher`) has been
intermittently **corrupted** (files show NUL bytes / truncated), so in-sandbox
`esbuild`/`tsc` validation is unreliable. The authoritative files (via the Read tool and
the user's running Metro) are correct. Validate by the user's Metro output, or by writing
copies into the outputs mount and esbuild-checking there.
