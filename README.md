# TEKAD Arcade

Kumpulan game TEKAD yang berjalan di [vinext](https://github.com/cloudflare/vinext) (Next.js di atas Vite) dan Cloudflare Worker, dengan database Cloudflare D1 (Drizzle). Seluruh game dilindungi login SSO Lahans.

## Game

| Game | Path |
|---|---|
| BIG 2: Wild Cards | `/big-two` |
| Eldric's Workshop | `/eldrics-workshop` |
| Sejuta Poin | `/sejuta-poin` |
| Switch Run | `/switch-run` |
| Saving Twilight | `/tekad-jrpg` |
| TEKAD Chronicles | `/chronicles/` |
| TEKAD Racing | `/tekad-racing` |
| TEKAD Jigsaw | `/jigsaw` |

Daftar lengkap, cover, dan artwork ada di [app/arcade-catalog.ts](app/arcade-catalog.ts).

## Prasyarat

- Node.js `>=22.13.0`
- Untuk `install:ci` dan `build`: Linux dengan `flock`, `curl`, dan GNU `timeout`. Skrip ini tidak berjalan native di macOS; lihat [Build di macOS](#build-di-macos).

## Memulai

```sh
npm ci
cp .env.example .env      # lalu isi nilai SSO_* (lihat bagian Login SSO)
npm run db:sso:local      # menyiapkan tabel sesi di D1 lokal
npm run dev
```

Restart server setelah mengubah `.env`.

## Login SSO Lahans

Login memakai API SSO Lahans melalui Worker. Browser hanya berbicara dengan origin Arcade; app key dan token tidak pernah dikirim ke browser.

Konfigurasi server (di `.env` untuk lokal, environment Worker untuk production):

| Variabel | Isi |
|---|---|
| `SSO_API_BASE_URL` | Base URL API SSO (HTTPS, kecuali localhost) |
| `SSO_APP_NAME` | Nama aplikasi terdaftar (`app_name` pada `/token/auth`) |
| `SSO_APP_KEY` | App key rahasia; simpan sebagai secret di production |
| `SSO_APP_CODE` | Nilai header `X-SSO-App-Code` pada login dan logout |

Jangan memakai prefix `VITE_` atau `NEXT_PUBLIC_` pada nilai ini. `.env` diabaikan Git.

Alur login (tiga request, dua di antaranya terlihat di tab Network browser):

```
Browser → POST /api/auth/token  → Worker → POST /token/auth        (token aplikasi, disegel di cookie HttpOnly)
Browser → POST /api/auth/login  → Worker → POST /sso/auth/login    (header token + X-SSO-App-Code)
```

- Sesi dibuat hanya jika respons `Success`, `status` bernilai `active`, dan `access.has_access` bernilai `true`. Selain itu login ditolak (403).
- Cookie sesi `tekad_arcade_session` berisi ID acak (HttpOnly, SameSite=Lax); token disimpan di D1, tabel `arcade_auth_sessions`.
- `GET /api/auth/session` memeriksa sesi (401 bila belum login). `POST /api/auth/logout` mencabut sesi lokal lalu memanggil `POST /sso/auth/logout`.
- Halaman game dan API game (`/api/big-two`, `/api/quiz`, `/api/leaderboard`, `/api/live`) diperiksa sebelum diteruskan; pengguna tanpa sesi diarahkan ke `/login?returnTo=…`.

Rincian perilaku, deployment production, dan keputusan implementasi ada di [docs/LAHANS_SSO.md](docs/LAHANS_SSO.md). Rancangan awal integrasi ada di [prd-sso-integration.md](prd-sso-integration.md).

## Struktur proyek

- `app/` — halaman, komponen, dan game (satu folder per game); `app/login/` untuk halaman login, `app/auth-provider.tsx` untuk status sesi di browser
- `worker/index.ts` — entry Cloudflare Worker; memanggil `handleSso` sebelum request diteruskan ke aplikasi
- `lib/sso/` — klien API Lahans (`client.ts`), handler endpoint dan sesi (`server.ts`), pembersihan storage browser
- `lib/sso-route-guard.ts` — penentuan path yang dilindungi
- `db/` dan `drizzle/` — skema dan migrasi D1 (`0009` menambah tabel sesi)
- `public/` — aset statis, termasuk `chronicles/` (game mandiri yang juga dilindungi Worker)
- `tests/` — tes Node (`node --test`)
- `docs/` — dokumentasi tambahan

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan Vite/vinext |
| `npm run build` | Build dan validasi artifact (Linux, GNU `timeout`) |
| `npm run start` | Menjalankan hasil build |
| `npm test` | Build, validasi, dan tes HTML terender |
| `npm run test:sso` | Tes autentikasi SSO (kontrak upstream, sesi, guard, UI, runtime Worker) |
| `npm run test:quiz` | Tes kuis |
| `npm run lint` | ESLint |
| `npm run db:generate` | Membuat migrasi Drizzle setelah skema berubah |
| `npm run db:sso:local` | Menerapkan migrasi tabel sesi ke D1 lokal (aman diulang) |
| `npm run validate:artifact` | Memeriksa ulang manifest dan ekspor `default.fetch` pada artifact |

Periksa tipe dengan `npx tsc --noEmit --incremental false`.

### Build di macOS

Skrip `build` dan `install:ci` menargetkan Linux. Di macOS tanpa GNU `timeout`:

```sh
node node_modules/vinext/dist/cli.js build
npm run validate:artifact
node --test tests/rendered-html.test.mjs
```

## Deployment

- Isi keempat nilai `SSO_*` di environment Worker production, dengan `SSO_APP_KEY` sebagai secret.
- Terapkan migrasi `drizzle/0009_arcade_auth_sessions.sql` ke database D1 yang diikat sebagai `DB`.
- Aset harus melewati Worker (`assets.run_worker_first: true`, binding `ASSETS`) supaya halaman statis seperti Chronicles ikut diperiksa. Konfigurasi build sudah mengaturnya.
- Proyek ini tidak memakai `wrangler.jsonc`; binding dideklarasikan di `.openai/hosting.json` dan disimulasikan oleh `vite.config.ts` saat pengembangan.

Skrip `install:ci` adalah satu kali `npm ci` tanpa retry, dan `build` memakai timeout lalu memvalidasi artifact. Batas waktu dapat diubah lewat `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, dan `SITES_BUILD_KILL_AFTER`. Direktori `.sites-runtime/` dibuat otomatis dan diabaikan Git.

## Catatan

- Penyimpanan skor, room, dan progres game masih mengikuti mekanisme perangkat yang sudah ada; belum dikaitkan ke GUID Lahans.
- Sesi yang sedang berjalan hanya memperbarui token (refresh). API SSO yang dipakai tidak menyediakan endpoint profil, jadi akun yang dinonaktifkan setelah login baru terdeteksi saat refresh token ditolak.
- Helper `app/chatgpt-auth.ts` (Sign in with ChatGPT) bawaan template masih ada, tetapi tidak dipakai oleh login Arcade, yang memakai SSO Lahans.
- Per pemeriksaan 26 Oktober 2026, lint seluruh proyek melaporkan error pada kode game/test yang ada sebelum integrasi SSO, dan tes `renders development preview metadata` belum lulus. Keduanya terpisah dari autentikasi (lihat [docs/LAHANS_SSO.md](docs/LAHANS_SSO.md)).

## Referensi

- [vinext](https://github.com/cloudflare/vinext)
- [Drizzle D1](https://orm.drizzle.team/docs/get-started/d1-new)
