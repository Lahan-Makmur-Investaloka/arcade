# Lahans SSO untuk TEKAD Arcade

Implementasi mengikuti [PRD integrasi](../prd-sso-integration.md): token aplikasi (`/token/auth`) → login `POST /sso/auth/login` (header `token` dan `X-SSO-App-Code`) → sesi Arcade. Ini belum menyediakan login otomatis lintas domain maupun logout global.

## Konfigurasi lokal

File [`.env`](../.env) lokal sudah disediakan dengan nilai kosong dan diabaikan Git. Gunakan [`.env.example`](../.env.example) sebagai contoh untuk checkout lain. Isi nilai yang didaftarkan oleh tim backend:

```dotenv
SSO_API_BASE_URL=https://layanan-sso.example.com/api/v1
SSO_APP_NAME=nama-aplikasi-terdaftar
SSO_APP_KEY=app-key-dari-backend
SSO_APP_CODE=kode-aplikasi-untuk-header-x-sso-app-code
```

Base URL harus menyertakan prefix API jika ada. HTTPS wajib untuk backend selain localhost. Jangan memakai prefix `VITE_` atau `NEXT_PUBLIC_`: app key dan token hanya digunakan Worker, bukan browser. Restart server setelah mengubah konfigurasi.

Siapkan tabel sesi lokal, lalu jalankan aplikasi:

```sh
npm run db:sso:local
npm run dev
```

Perintah migrasi hanya menyentuh D1 lokal pada `.wrangler/state/v3/d1`, dengan binding dan ID database yang sama seperti [konfigurasi Vite](../vite.config.ts). Aman dijalankan ulang. Ia tidak menerapkan migrasi tabel game; gunakan migrasi game yang sudah ada bila membuat database Arcade lokal baru.

## Deployment

- Sediakan empat nilai `SSO_*` pada environment Worker production. Simpan `SSO_APP_KEY` sebagai secret server melalui platform hosting. File `.env` bukan konfigurasi production dan jangan dipublikasikan.
- Terapkan [migrasi sesi](../drizzle/0009_arcade_auth_sessions.sql) ke database D1 yang diikat sebagai `DB`, menggunakan mekanisme migrasi platform yang sudah digunakan proyek. Metadata Drizzle disertakan. Jangan mengganti ID database production dengan ID placeholder development.
- Aset harus melewati Worker (`assets.run_worker_first: true`, binding `ASSETS`) agar HTML Chronicles ikut diperiksa. Konfigurasi build sudah mengaturnya; jika memakai hosting lain, pertahankan perilaku yang sama.
- Browser mengakses API autentikasi pada origin Arcade. Worker meneruskan request ke Lahans dengan header `token` atau `refresh-token`; browser tidak perlu CORS langsung ke Lahans. Pastikan Worker boleh mencapai backend tersebut.

## Perilaku dan keputusan implementasi

- Login berjalan dua langkah dari browser: `POST /api/auth/token` (Worker meminta token aplikasi ke `/token/auth`; token disegel AES-GCM dalam cookie HttpOnly `tekad_arcade_boot`, berlaku maksimal 5 menit, sekali pakai, dan tidak pernah ada di body respons) lalu `POST /api/auth/login`. Jika cookie hilang atau rusak, login meminta token baru sendiri. Kunci penyegelan diturunkan dari `SSO_APP_KEY`.
- Endpoint lokal: `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`. Mutasi mewajibkan header `Origin` yang sama dengan aplikasi.
- Username dan password dikirim hanya saat login. Token, refresh token, dan app key tidak dikirim kembali ke browser. Profil browser dibatasi pada GUID pengguna, employee GUID, serta nama.
- Sesi dibuat hanya jika indikator `Success`, GUID, employee GUID, nama, `status: "active"`, dan `access.has_access: true` dari respons `/sso/auth/login` lolos validasi. Akun nonaktif atau tanpa akses ditolak dengan 403. Tidak ada lagi pemanggilan `/auth/profile`; browser hanya menerima GUID, employee GUID, dan nama.
- Cookie `tekad_arcade_session` berisi ID acak; D1 hanya menyimpan hash ID tersebut beserta token dan profil minimal. Cookie memakai HttpOnly, SameSite=Lax, dan Secure pada HTTPS. Lindungi akses D1 karena token upstream disimpan di server.
- Masa berlaku cookie dibatasi expiry backend saat login; rotasi token tidak memperpanjang batas sesi browser awal. Expiry backend menerima timestamp ISO dengan timezone, atau format `YYYY-MM-DD HH:mm:ss` yang ditafsirkan sebagai UTC. Nilai invalid/kedaluwarsa ditolak.
- Refresh menggunakan lease D1 dan pemeriksaan revision agar berlaku lintas instance Worker. Rotasi refresh token dipersistenkan. Refresh gagal tidak membuat token aplikasi anonim untuk menggantikan sesi pengguna. Satu request upstream hanya dicoba ulang sekali setelah refresh, di bawah batas maksimum PRD.
- Game dan API game dilindungi sebelum dispatch, termasuk URL terenkode, slash ganda, dan request RSC. Sesi tervalidasi boleh digunakan kembali selama paling lama 30 detik pada guard; pemeriksaan ulang hanya memperbarui token (refresh) karena API SSO yang dipakai tidak menyediakan endpoint profil. Akun yang dinonaktifkan setelah login baru terdeteksi saat refresh token ditolak. Browser memeriksa saat focus, visible, dan setiap 60 detik. Gangguan jaringan menampilkan retry, bukan sukses palsu.
- Logout mencabut sesi D1 sebelum memanggil `POST /sso/auth/logout` (header `token` dan `X-SSO-App-Code`). Kegagalan upstream tidak menghalangi logout lokal. Logout dan respons gagal tidak mengirim penghapusan cookie: respons lama dari tab akun A tidak boleh menghapus cookie baru milik akun B. Yang tertinggal hanya pointer acak yang sudah tidak berlaku; pointer habis sesuai expiry atau diganti login berikutnya, tanpa token upstream yang dapat digunakan.
- Data browser milik Arcade (`tekad-*`) dibersihkan saat login/logout/pergantian akun. Cookie dan storage aplikasi lain dipertahankan. Tab lain memuat ulang lewat event storage; pemeriksaan sesi menjadi fallback bila storage diblokir.
- Penyimpanan skor, room, dan progres game masih mengikuti mekanisme perangkat yang sudah ada. Perubahan ini membatasi akses dengan sesi Lahans; belum memigrasikan kepemilikan record game menjadi GUID Lahans atau menyinkronkan progres lintas perangkat. Data lokal dibersihkan saat berganti akun.
- Tujuan setelah login tetap dibawa melalui `returnTo` yang divalidasi, tetapi tidak ditampilkan di form sesuai permintaan UI.

## Verifikasi

```sh
npm run test:sso
npx tsc --noEmit --incremental false
```

Tes mencakup kontrak request, bootstrap/login/profil, kegagalan bisnis, identitas salah, parsing expiry, refresh/rotasi bersamaan, retry 401, 403, logout gagal, respons terlambat, CSRF, guard API/RSC/aset, render form, isolasi storage, dan kompatibilitas fetch dengan runtime Cloudflare asli melalui Miniflare. Tidak menggunakan kredensial produksi.

Build/test utama proyek memakai GNU `timeout` dan menargetkan Linux. Pada macOS tanpa utilitas tersebut, build langsung dapat diperiksa dengan `node node_modules/vinext/dist/cli.js build`, lalu `npm run validate:artifact` dan `node --test tests/rendered-html.test.mjs`.

Uji ke backend staging masih memerlukan URL dan kredensial aplikasi/akun uji. Sebelum rilis, konfirmasi kaitan token dengan pengguna, relasi GUID profil, timezone, rotasi refresh token, akun nonaktif/rate limit, cakupan logout, serta seluruh keputusan backend pada bagian 12 PRD. Uji lokal dengan upstream tiruan tidak menggantikan validasi tersebut.

Hasil pemeriksaan lokal 26 Oktober 2026: tes SSO, TypeScript, build Vinext langsung, dan validasi artifact lulus. Browser QA dengan backend tiruan berhasil masuk → Jigsaw → keluar; backend tiruan dihentikan setelah pengujian. Lint pada file SSO tidak memiliki error (satu warning logo `<img>`). Lint seluruh proyek melaporkan 59 error dan 88 warning pada kode game/test yang sudah ada. Tes utama `renders development preview metadata` masih gagal karena markup tidak memuat meta `codex-preview=development`; ini terpisah dari autentikasi. Wrapper `npm test` juga tetap membutuhkan GNU `timeout`.
