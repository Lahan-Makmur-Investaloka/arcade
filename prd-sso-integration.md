# PRD Implementasi SSO Lahans pada Aplikasi Lain

| Atribut | Keterangan |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 26 Oktober 2026 |
| Status | Draft untuk handoff implementasi dan penyelarasan kontrak backend |
| Pembaca | Product Owner, Frontend Engineer, Backend Engineer, QA, dan DevOps |
| Referensi utama | [SsoForm](../src/features/auth/sso-form.tsx) dan modul autentikasi pendukung |

## 1 Ringkasan produk

Aplikasi tujuan harus memungkinkan pengguna masuk menggunakan akun Lahans melalui layanan autentikasi yang sama dengan Lahans Lens. Integrasi mencakup pembuatan token aplikasi, pengiriman kredensial, penyimpanan sesi, pengambilan profil, perlindungan halaman, perpanjangan token, serta sign out.

Implementasi referensi menggunakan form username/password yang mengirim `POST /auth/sso/login`. Frontend tidak memperlihatkan alur redirect ke Identity Provider, authorization code, callback OAuth/OIDC, atau SAML. Penggunaan istilah SSO dalam PRD ini mengikuti endpoint yang tersedia. Login otomatis setelah masuk di aplikasi lain dan logout serentak lintas aplikasi merupakan kemampuan terpisah yang harus dikonfirmasi ke backend.

Bagian **perilaku referensi** menjelaskan kode saat ini. Bagian **kebutuhan aplikasi tujuan** menetapkan hasil implementasi yang harus dipenuhi, termasuk perbaikan agar cache profil dan kegagalan autentikasi tidak menghasilkan sesi yang keliru.

## 2 Tujuan dan ruang lingkup

### 2.1 Tujuan

1. Pengguna dapat memakai kredensial akun Lahans pada aplikasi tujuan.
2. Tim dapat mengimplementasikan integrasi tanpa hanya menyalin komponen tampilan.
3. Halaman privat menerima identitas dan profil yang sesuai dengan pengguna aktif.
4. Token kedaluwarsa, gangguan jaringan, dan logout ditangani secara konsisten.

### 2.2 Cakupan rilis pertama

- Halaman sign in dengan identitas visual aplikasi tujuan.
- Integrasi endpoint token, SSO login, profil, dan SSO logout.
- State autentikasi global, penyimpanan sesi, dan route guard.
- Refresh token, penanganan 401, dan pembersihan sesi.
- Pengujian integrasi serta konfigurasi environment dan deployment.

Registrasi, reset password, MFA, pengelolaan akun, penambahan protokol OAuth/OIDC/SAML, dan login otomatis lintas domain berada di luar rilis pertama. Perluasan tersebut memerlukan kontrak tersendiri. Aturan otorisasi bisnis aplikasi tujuan tetap menjadi tanggung jawab backend aplikasi tersebut.

## 3 Pengguna dan user stories

| Pengguna | Kebutuhan | Hasil yang diharapkan |
| --- | --- | --- |
| Pemilik akun Lahans | Masuk dengan akun yang sudah dimiliki | Tidak perlu membuat akun baru pada aplikasi tujuan, sesuai provisioning backend |
| Pengguna aktif | Memuat ulang atau membuka kembali aplikasi | Tetap masuk selama sesi backend dan token masih berlaku |
| Pengguna dengan sesi habis | Mengetahui bahwa login ulang diperlukan | Kembali ke sign in tanpa halaman privat yang masih dapat digunakan |
| Pengguna yang berbagi perangkat | Keluar dan mengganti akun | Identitas serta profil akun sebelumnya tidak terbawa |
| Tim aplikasi | Menggunakan integrasi yang dapat dipelihara | Kontrak API, tanggung jawab modul, dan kriteria penerimaan jelas |

## 4 Arsitektur dan alur autentikasi

### 4.1 Komponen yang diperlukan

| Komponen | Tanggung jawab |
| --- | --- |
| Form sign in | Input, validasi, status loading, submit, dan pesan hasil |
| Service login | Memanggil endpoint SSO dengan username/password |
| HTTP client utama | Menyisipkan header token, memproses respons, refresh, dan kegagalan sesi |
| HTTP client token | Memanggil endpoint token tanpa interceptor autentikasi utama agar tidak rekursif |
| Auth provider atau state global setara | Menyediakan status login dan operasi login/logout |
| Service profil | Mengambil profil, menyimpan cache, dan memastikan identitas siap digunakan |
| Route guard | Membatasi halaman publik/privat dan menunggu kesiapan profil |
| Session manager | Memulihkan sesi lokal, mendeteksi kedaluwarsa, dan membersihkan state |

Aplikasi tujuan boleh memakai framework lain. Tanggung jawab serta urutan dependensi di atas tetap harus dipertahankan; nama file, hook, dan library UI tidak menjadi kontrak backend.

### 4.2 Perilaku referensi saat sign in

1. Pengguna membuka `/sign`. Pengguna yang sudah dianggap terautentikasi oleh state lokal diarahkan oleh public route guard ke `/dashboard/general`.
2. Pengguna mengisi Email dan Password. Label Email memakai input `type="text"` dengan nama payload `username`; validasi format email belum diterapkan.
3. Submit dicegah jika username/password kosong atau proses sebelumnya masih berjalan. Tombol menampilkan spinner dan `SSO Checking...`.
4. Form memanggil `ssoLogin({ username, password })` melalui HTTP client utama.
5. Sebelum request dikirim, interceptor memastikan ada token aplikasi. Jika tidak ada kedua cookie token, client memanggil `/token/auth`. Jika hanya refresh token tersedia, client mencoba `/token/refresh`.
6. Request login membawa header `token`. Login dianggap berhasil jika `message.en === "Success"` dan `data.guid` tersedia.
7. `auth.login()` menyimpan user GUID dan employee GUID ke localStorage serta mengubah state autentikasi.
8. Form mencoba mengambil profil jika cache belum ada atau belum memiliki `id`. Setelah itu form menampilkan `Login successful` dan memanggil navigasi ke `/dashboard/general`.
9. Protected route guard juga menunggu proses perbaikan cache profil sebelum merender halaman privat.

Pada referensi, perubahan state autentikasi terjadi sebelum pengambilan profil selesai sehingga public route guard juga dapat memulai redirect. Karena itu kesiapan data tidak boleh hanya bergantung pada urutan navigasi di form.

### 4.3 Perilaku referensi saat sesi berjalan

- Token aplikasi disisipkan sebagai header `token` pada request melalui client utama.
- Refresh dilakukan saat cookie access token tidak ada tetapi refresh token masih ada; tidak ada refresh terjadwal sebelum expiry.
- Request yang bersamaan ketika refresh pada request interceptor berlangsung menunggu hasil proses tersebut. Antrean harus selesai atau ditolak ketika refresh gagal.
- Pembuatan token pertama dan penanganan 401 pada response interceptor tidak memakai pengaman antrean yang sama.
- Provider mengecek keberadaan cookie ketika tab mendapat focus, dokumen kembali visible, dan setiap 60 detik selama pengguna aktif.
- Keberadaan user GUID dan setidaknya satu cookie token dipakai sebagai indikasi sesi lokal. Validitas sesi server tetap ditentukan oleh respons API.

### 4.4 Perilaku referensi saat sign out

Menu Sign out memanggil `/auth/sso/logout`, kemudian membersihkan sesi lokal dan menjalankan `window.location.replace("/sign")`. State lokal tetap dibersihkan saat request logout gagal. Respons 401 dari endpoint logout tidak boleh memicu redirect lain yang bersaing dengan proses ini.

## 5 Kontrak integrasi API

Semua path berikut relatif terhadap base URL backend yang disediakan untuk aplikasi tujuan. Kontrak ini diambil dari pemanggilan frontend; tim backend harus menyediakan contoh respons staging dan memastikan keterkaitan token dengan sesi pengguna.

### 5.1 Daftar endpoint

| Endpoint | Method | Input utama | Header khusus | Output yang dipakai |
| --- | --- | --- | --- | --- |
| `/token/auth` | POST | Identitas aplikasi dan perangkat | `Accept: application/json`, `Content-Type: application/json` | Token, refresh token, dan expiry keduanya |
| `/token/refresh` | GET | Tidak ada body | `refresh-token: <refresh_token>` | Token dan metadata expiry; respons juga dapat memuat refresh token |
| `/auth/sso/login` | POST | `username`, `password` | `token: <token>` | `message.en`, `data.guid`, `data.employee_guid` |
| `/auth/profile` | POST | Tidak ada body | `token: <token>` | Profil pengguna aktif |
| `/auth/sso/logout` | POST | Tidak ada body | `token: <token>` | Hasil invalidasi sesi server |

Client utama juga menambahkan `Accept: application/json`. Header autentikasi referensi adalah `token`, bukan `Authorization: Bearer`. Endpoint token memakai client terpisah; service yang memakai client utama menerima body JSON langsung karena response interceptor mengembalikan `response.data`.

### 5.2 Pembuatan token aplikasi

Contoh body dengan placeholder, bukan kredensial produksi:

```json
{
  "app_name": "<nama-aplikasi-terdaftar>",
  "app_key": "<app-key-dari-backend>",
  "device_id": "<device-type>-<visitor-id>",
  "device_type": "Web",
  "fcm_token": "",
  "ip_address": "0.0.0.0"
}
```

Referensi memperoleh `visitor-id` dari FingerprintJS dan nama client dari device-detector-js. Jika nama client tidak dikenali, `device_type` memakai `Web`. Nilai `device_id` berfungsi sebagai identitas perangkat menurut kontrak backend, bukan bukti autentikasi pengguna. `ip_address` pada frontend adalah placeholder; backend harus menentukan IP tepercaya bila diperlukan.

Body respons minimum yang dikonsumsi:

```json
{
  "message": { "id": "<pesan>", "en": "Success" },
  "data": {
    "token": "<access-token>",
    "token_expired": "<waktu-expiry>",
    "refresh_token": "<refresh-token>",
    "refresh_token_expired": "<waktu-expiry>"
  }
}
```

Frontend referensi menambahkan `Z` pada string expiry sebelum parsing, sehingga mengasumsikan timestamp backend belum memiliki penanda timezone dan merepresentasikan UTC. Aplikasi tujuan harus menggunakan format timestamp yang disepakati dan menguji parsing; jangan menambahkan `Z` dua kali. Tidak ada durasi token tetap yang boleh diasumsikan dari frontend.

### 5.3 Login SSO

```json
{
  "username": "<email-atau-username-yang-diterima-backend>",
  "password": "<password>"
}
```

Contoh body respons minimum:

```json
{
  "message": { "id": "<pesan>", "en": "Success" },
  "data": {
    "guid": "<user-guid>",
    "employee_guid": "<employee-guid>"
  }
}
```

Tipe respons referensi juga mendefinisikan `employee_fulname`, `username`, `status`, `created_at`, dan `created_by`; penamaan `employee_fulname` mengikuti tipe yang ada. Contoh di atas hanya menampilkan field yang diperlukan alur form. Response login tidak dipakai untuk mengambil token baru; hubungan login pengguna dengan token aplikasi harus dipastikan oleh backend.

### 5.4 Profil dan identitas

Body respons profil mengikuti envelope `message` dan `data` yang sama. Field penting untuk integrasi adalah `id` numerik, `guid`, `fullname`, dan informasi profil/role yang dibutuhkan aplikasi tujuan. Skema lengkap referensi tersedia pada [tipe Profile](../src/types/auth.ts).

| Nilai | Sumber | Penggunaan pada referensi |
| --- | --- | --- |
| User GUID | Login `data.guid` | Identitas login lokal pada key `user` |
| Employee GUID | Login `data.employee_guid` | Disimpan pada key `employee_id`, meskipun nilainya GUID |
| Numeric employee ID | Profil `data.id` | Filter laporan `pic_employee_key`, dikonversi menjadi number |
| Profil | `/auth/profile` | Cache JSON pada key `profile` |

Employee GUID tidak boleh dipakai menggantikan numeric employee ID. Untuk aplikasi tanpa laporan tersebut, petakan identitas sesuai kontrak domainnya; jangan mengirim `pic_employee_key` jika API tujuan tidak membutuhkannya.

## 6 Kebutuhan aplikasi tujuan

Semua kebutuhan berikut wajib untuk rilis pertama kecuali ditandai opsional. Kebutuhan kesiapan profil dan isolasi akun memperketat perilaku referensi sebagaimana dijelaskan pada bagian 9.

| ID | Kebutuhan | Kriteria implementasi |
| --- | --- | --- |
| FR01 | Form sign in | Username/email dan password wajib diisi; Enter dapat submit; password tersamarkan dan dapat ditampilkan dengan tombol berlabel aksesibel |
| FR02 | Pencegahan submit ganda | Selama satu submit berjalan, submit tambahan tidak menghasilkan request login baru; loading selalu berhenti pada hasil sukses maupun gagal |
| FR03 | Bootstrap token | Token aplikasi tersedia sebelum request login; kegagalan bootstrap menghentikan request dan menghasilkan pesan yang dapat ditindaklanjuti |
| FR04 | Validasi hasil login | HTTP 200 saja tidak cukup; cocokkan indikator sukses dan validasi field identitas yang dibutuhkan aplikasi |
| FR05 | Pemisahan sesi dan kesiapan profil | Halaman privat yang memerlukan profil hanya aktif setelah profil akun yang benar tersedia dan lolos validasi |
| FR06 | Pemulihan sesi | Saat reload, user GUID tanpa kedua cookie token dibersihkan; jika refresh token masih tersedia, proses refresh dijalankan saat request membutuhkan token |
| FR07 | Perlindungan route | Pengguna tanpa sesi menuju sign in; pengguna yang sudah siap memakai aplikasi menuju landing page; tidak terjadi redirect berulang |
| FR08 | Refresh dan request bersamaan | Token diperbarui sesuai kontrak backend; request yang menunggu selalu selesai atau ditolak; jangan menggantung saat refresh gagal |
| FR09 | Penanganan 401 | Bedakan kesalahan password, sesi belum login, logout, dan token invalid; retry dibatasi dan akhirnya membersihkan sesi jika tetap tidak sah |
| FR10 | Deteksi sesi habis | Cek pada focus, visibility visible, dan interval 60 detik; ketika kedua cookie tidak tersedia, state lokal dikeluarkan |
| FR11 | Sign out | Panggil SSO logout; bersihkan token, identitas, profil, dan cache privat di aplikasi tujuan meskipun API gagal; arahkan ke sign in |
| FR12 | Pergantian akun | Hapus/isolasi cache akun sebelumnya dan cegah respons profil lama menimpa sesi baru setelah logout atau pergantian akun |
| FR13 | Adaptasi aplikasi | Base URL, identitas aplikasi, route sign in, landing page, dan branding dapat disesuaikan tanpa mengubah kontrak autentikasi |

### 6.1 Penanganan error dan retry

| Kondisi | Perilaku referensi | Kebutuhan aplikasi tujuan |
| --- | --- | --- |
| Respons bisnis bukan sukses | Toast memakai `message.en`, fallback `Login failed` | Tidak membentuk sesi baru; pesan aman dan dapat dipahami pengguna |
| Error request login | Mengambil `response.data.message.en`, fallback pesan umum | Loading selesai dan pengguna dapat mencoba kembali |
| 401 `Password Not Match` | Ditolak tanpa refresh/redirect otomatis | Form tetap tersedia untuk koreksi kredensial |
| 401 `Please login first` | Membersihkan sesi dan menuju `/sign` | Login ulang diminta tanpa retry token yang sia-sia |
| 401 pada SSO logout | Diserahkan ke proses logout | Pembersihan lokal tetap selesai |
| 401 lain | Mencoba refresh, kemudian token baru; penanda retry membatasi percobaan | Tetapkan maksimum dua retry setelah request awal dan uji agar tidak terjadi loop |
| Gangguan jaringan atau server | Error diteruskan ke pemanggil | Pesan tersedia, antrean dilepas, dan tidak menampilkan sukses palsu |
| Profil gagal atau `id` wajib tidak valid | Helper dapat mengembalikan `null` | Halaman yang membutuhkan profil tetap tertahan; tampilkan retry atau kembali sign in |

Jangan menganggap respons 403 sebagai token kedaluwarsa tanpa kesepakatan backend. Kegagalan izin perlu ditampilkan sebagai akses ditolak dan tidak boleh disiasati dengan mengubah identitas lokal.

### 6.2 Tampilan dan aksesibilitas

Gunakan label field yang terhubung ke input, `autocomplete="username"` dan `autocomplete="current-password"`, fokus keyboard yang terlihat, serta pesan error yang dapat diakses pembaca layar. Form harus tetap dapat dipakai pada layar kecil dan loading tidak boleh menghilangkan konteks input.

Warna, logo, teks promosi, font, dan carousel pada referensi bersifat opsional. Jika carousel dipertahankan, referensi berpindah setiap 4,5 detik, berhenti saat hover/focus, dan menonaktifkan perpindahan otomatis jika `prefers-reduced-motion` aktif ketika komponen dimuat.

## 7 Penyimpanan dan keamanan integrasi

### 7.1 Perilaku penyimpanan referensi

- Cookie `token` dan `refresh_token` ditulis oleh JavaScript dengan `expires` dari backend dan `path=/`.
- Helper tidak menetapkan atribut `Secure`, `HttpOnly`, `SameSite`, atau `Domain` secara eksplisit. Cookie yang dibuat JavaScript tidak dapat memakai perlindungan HttpOnly.
- Token dikirim melalui header oleh HTTP client; referensi tidak mengonfigurasi `withCredentials` untuk pertukaran cookie lintas origin.
- localStorage menyimpan identitas dan profil. Profil referensi mencakup data pribadi di luar kebutuhan login, sehingga aplikasi tujuan perlu membatasi data yang disimpan.
- Helper pembersihan mencoba menghapus semua cookie yang terlihat melalui JavaScript pada path `/`, bukan hanya cookie autentikasi.

### 7.2 Persyaratan deployment aplikasi tujuan

1. Gunakan HTTPS pada deployment dan jangan mencatat password, token, refresh token, atau app key ke log/analytics.
2. Sediakan registrasi aplikasi dan nilai `app_name`/`app_key` yang sesuai. Jangan menganggap kredensial aplikasi referensi dapat dipakai ulang.
3. Nilai frontend berawalan `VITE_` dapat dibaca pengguna. Jika `app_key` harus menjadi rahasia server, panggilan yang memerlukannya harus dipindahkan ke backend/BFF; tim backend menentukan apakah kontrak saat ini memang mengizinkan public client.
4. Tentukan kebijakan penyimpanan token bersama backend. Jika tetap memakai cookie yang dibaca JavaScript, tetapkan atribut cookie yang sesuai deployment dan batasi paparan script. Peralihan ke cookie HttpOnly memerlukan perubahan kontrak karena client tidak lagi dapat membaca token untuk header `token`.
5. Gunakan namespace atau isolasi origin untuk cookie dan localStorage aplikasi tujuan. Jangan menyalin key global jika beberapa aplikasi berbagi origin/host dan berpotensi menimpa sesi. Perbedaan port tidak mengisolasi cookie pada host yang sama.
6. Bersihkan hanya cookie, identitas, profil, dan cache milik aplikasi tujuan. Jangan menyalin perilaku penghapusan semua cookie pada host bersama.
7. Backend wajib memvalidasi sesi, hak akses, dan cakupan data. GUID lokal serta `pic_employee_key` dari frontend tidak menjadi bukti izin.
8. Konfigurasikan CORS bila frontend dan API berbeda origin, termasuk preflight untuk header `token`, `refresh-token`, dan `Content-Type` sesuai endpoint yang dipanggil.
9. Tinjau penyimpanan profil dan fingerprint sesuai kebijakan privasi organisasi; simpan hanya atribut yang diperlukan aplikasi.

Cookie dan localStorage pada frontend tidak otomatis dibagikan ke domain aplikasi lain. Kemampuan SSO lintas aplikasi harus disediakan melalui mekanisme yang memang didukung layanan identitas.

## 8 Konfigurasi dan deployment

| Konfigurasi referensi | Pemakaian | Tindakan tim aplikasi tujuan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL client API dan token | Isi URL environment yang disediakan backend |
| `VITE_APP_NAME` | Body `app_name` pada `/token/auth` | Gunakan nama aplikasi yang terdaftar |
| `VITE_SECRET_KEY` | Body `app_key` pada `/token/auth` | Pastikan klasifikasi public client atau pindahkan rahasia ke server |
| `VITE_SERVICE_NAME` | Tersedia pada konfigurasi umum | Tidak dipakai langsung dalam request SSO/token yang ditelusuri |
| Route sign in | `/sign` pada referensi | Sesuaikan seluruh guard, error handler, dan logout |
| Landing page | `/dashboard/general` pada referensi | Tetapkan halaman awal aplikasi tujuan secara konsisten |

Pada stack referensi, baca konfigurasi melalui [environment](../src/lib/env.ts), yang mendukung runtime `window.__ENV__` dan fallback build-time. Jangan menambahkan pembacaan environment tersebar pada service atau komponen.

Pastikan server hosting mengembalikan entry SPA saat route privat dibuka langsung. Proxy `/api` harus dikonfigurasi jika akan digunakan; [konfigurasi Vite saat ini](../vite.config.ts) tidak mendefinisikan `server.proxy`, sehingga prefix `/api` saja tidak membentuk proxy.

## 9 Perbedaan yang harus ditangani saat replikasi

| Area | Kondisi pada kode referensi | Keputusan implementasi aplikasi tujuan |
| --- | --- | --- |
| Profil gagal | `fetchAndStoreProfile()` menangkap error dan mengembalikan `null`; guard melanjutkan setelah promise selesai | Validasi hasil profil sebelum membuka halaman yang bergantung padanya |
| Cache profil akun lain | Cache yang memiliki `id` dapat digunakan kembali tanpa pencocokan identitas pada alur login | Ambil profil baru setelah login atau cocokkan pemilik cache melalui identitas backend yang disepakati |
| State login lebih awal | State authenticated diubah sebelum pemuatan profil selesai | Bedakan status identitas sudah login dan profil siap, atau tahan route privat sampai seluruh syarat terpenuhi |
| Rotasi refresh token | Jalur refresh pada request interceptor menyimpan kembali refresh token lama; helper refresh pada respons memakai nilai dari respons | Tetapkan satu kebijakan sesuai kontrak rotasi; gunakan nilai baru jika backend merotasi token |
| Request paralel | Pengaman proses tunggal hanya mencakup refresh pada request interceptor | Uji bootstrap dan 401 paralel; serialisasikan bila diperlukan oleh kontrak backend |
| Pembersihan cookie | Menghapus semua cookie yang terlihat pada path `/` | Hapus cookie autentikasi aplikasi tujuan secara spesifik |
| Logout gagal | Sesi lokal dibersihkan tanpa jaminan invalidasi server berhasil | Jangan mengklaim logout global; pastikan kebijakan invalidasi dan retry sesuai backend |

Perbedaan ini merupakan pekerjaan pada aplikasi tujuan. PRD ini tidak mengubah perilaku kode aplikasi referensi.

## 10 Rencana pekerjaan tim

| Tahap | Penanggung jawab | Hasil |
| --- | --- | --- |
| 1 Penyelarasan kontrak | Backend dan Tech Lead | Base URL, registrasi aplikasi, payload/response staging, expiry, rotasi token, serta definisi cakupan SSO/logout |
| 2 Fondasi integrasi | Frontend dan DevOps | Konfigurasi environment, dua HTTP client, token manager, penyimpanan terisolasi, dan CORS/hosting siap |
| 3 Alur pengguna | Frontend | Form, state autentikasi, pemuatan profil, route guard, sign out, dan penanganan error |
| 4 Validasi integrasi | QA dan Backend | Skenario penerimaan berjalan pada staging dengan akun uji dan kondisi expiry/gagal yang dapat direproduksi |
| 5 Peluncuran | Product Owner dan tim aplikasi | Seluruh kebutuhan wajib lolos, konfigurasi production tersedia, dan rollback ke versi sebelumnya disiapkan |

Tidak diperlukan shared SDK pada rilis pertama. Gunakan modul autentikasi kecil sesuai stack aplikasi; ekstraksi SDK dapat diputuskan jika beberapa aplikasi sudah menunjukkan kebutuhan yang sama.

## 11 Kriteria penerimaan dan pengujian

| ID | Skenario | Hasil yang harus diterima QA |
| --- | --- | --- |
| AC01 | Field username/password kosong | Tidak ada request login; pengguna mendapat petunjuk input wajib |
| AC02 | Klik submit atau Enter berkali-kali ketika loading | Hanya satu proses login aktif; tombol kembali tersedia setelah selesai |
| AC03 | Belum ada token pada browser | Bootstrap token selesai sebelum request SSO; header `token` terisi |
| AC04 | Kredensial valid dan profil valid | Identitas disimpan, profil akun sesuai, lalu landing page terbuka |
| AC05 | HTTP 200 dengan pesan bukan `Success` atau identitas tidak lengkap | Tidak membentuk sesi siap pakai dan menampilkan error |
| AC06 | 401 `Password Not Match` | Tidak menjalankan retry token atau hard redirect; pengguna dapat memperbaiki password |
| AC07 | Bootstrap, login, atau profil mengalami timeout/server error | Loading berakhir, error tampil, dan tidak membuka halaman yang kekurangan data wajib |
| AC08 | Reload dengan user GUID dan token valid | Sesi dipulihkan tanpa meminta input kredensial ulang; profil diverifikasi sesuai kebutuhan |
| AC09 | User GUID masih ada tetapi kedua cookie sudah tidak ada | Identitas dan profil lama dibersihkan; pengguna menuju sign in |
| AC10 | Access token habis dan refresh token masih ada | Token diperbarui lalu request diteruskan dengan token hasil refresh |
| AC11 | Backend merotasi refresh token | Refresh berikutnya menggunakan token yang diwajibkan kontrak backend |
| AC12 | Beberapa request menunggu refresh yang gagal | Semua request selesai dengan hasil/error; tidak ada promise yang menggantung |
| AC13 | 401 terus berulang | Retry tidak melebihi batas; sesi dibersihkan dan tidak terjadi loop redirect |
| AC14 | 401 `Please login first` | Segera meminta login ulang tanpa rangkaian retry yang tidak relevan |
| AC15 | Kedua cookie habis saat pengguna diam | Provider mengeluarkan sesi pada pemeriksaan berikutnya; focus/visibility juga memicu pemeriksaan |
| AC16 | Cache profil hilang atau belum memiliki ID numerik yang diwajibkan | Profil diambil; request bisnis menunggu nilai valid dan tidak memakai employee GUID sebagai ID numerik |
| AC17 | Logout normal maupun API logout gagal/401 | State lokal, profil, token, dan cache privat bersih; sign in terbuka |
| AC18 | Login akun B setelah akun A atau respons profil A datang terlambat | Profil/data A tidak muncul dalam sesi B; respons lama tidak memulihkan sesi A |
| AC19 | Dua aplikasi pada host/origin yang sama | Cookie/storage tidak saling menimpa dan logout tidak menghapus cookie aplikasi lain |
| AC20 | Akses langsung route privat tanpa sesi, lalu buka sign in dengan sesi siap | Guard mengarahkan ke tujuan yang benar tanpa loop |
| AC21 | Origin API berbeda dan halaman privat dibuka langsung dari URL | CORS/preflight lolos sesuai kontrak; hosting SPA merender route dengan benar |
| AC22 | Navigasi keyboard, toggle password, layar kecil, dan reduced motion | Form dapat digunakan; tombol memiliki label dan carousel opsional mengikuti preferensi gerak |

Uji API pada staging dengan akun uji; simulasikan expiry, rotasi, 401, profil gagal, dan request bersamaan. Pada repo referensi belum ada test runner, sehingga pengujian manual/integrasi perlu dicatat. Build dan lint pada aplikasi tujuan tetap harus lolos, tetapi tidak menggantikan pengujian autentikasi dengan backend.

Kriteria selesai rilis pertama adalah seluruh FR dan AC yang berlaku lolos, keputusan backend pada bagian 12 terselesaikan, dan tidak ada password/token/app key pada bukti QA atau log aplikasi. Jika fitur opsional tidak diterapkan, catat AC terkait sebagai tidak berlaku beserta alasannya.

## 12 Keputusan yang diperlukan dari backend

| Pertanyaan | Dampak pada implementasi |
| --- | --- |
| Apa base URL, `app_name`, dan kebijakan `app_key` aplikasi baru pada staging/production? | Menentukan konfigurasi dan apakah diperlukan perantara server |
| Apakah input hanya email atau juga username? Bagaimana provisioning dan akun nonaktif ditangani? | Menentukan validasi form serta kondisi gagal login |
| Bagaimana `/auth/sso/login` mengaitkan pengguna dengan token yang sudah dibuat? | Memastikan request profil dan bisnis mengenali sesi pengguna yang benar |
| Apa format timezone/expiry dan apakah refresh token dirotasi? | Menentukan parser tanggal, penyimpanan, dan alur refresh berikutnya |
| Apakah membuat token baru setelah refresh gagal mempertahankan sesi pengguna? | Menentukan apakah fallback harus langsung meminta login ulang |
| Apa field profil minimum, relasi GUID, dan ID numerik yang sah? | Menentukan validasi profil dan pemisahan cache antar akun |
| Apa kontrak lengkap error, rate limit, dan batas percobaan login? | Menentukan pesan, retry, dan respons terhadap pembatasan backend |
| Apakah logout berlaku untuk token/perangkat ini, seluruh perangkat, atau aplikasi lain? | Menentukan arti Sign out dan pengujian invalidasi server |
| Apakah ada mekanisme login otomatis lintas aplikasi/domain? | Menentukan apakah perlu fase lanjutan dengan redirect atau protokol identitas lain |

## 13 Referensi kode untuk implementer

Link berikut relatif terhadap repository agar tetap dapat digunakan oleh tim yang membuka salinannya.

| Referensi | Bagian yang dipelajari |
| --- | --- |
| [Form SSO](../src/features/auth/sso-form.tsx) | State input, submit, pesan hasil, dan tampilan |
| [Service login](../src/services/auth/login.ts) | Endpoint SSO dan payload kredensial |
| [HTTP client utama](../src/services/http/api-client.ts) | Header token, antrean refresh, unwrap respons, dan penanganan 401 |
| [Service token](../src/services/http/token.ts) | Identitas aplikasi/perangkat dan endpoint token |
| [Helper cookie](../src/services/http/cookies.ts) | Penulisan, pembacaan, dan penghapusan token |
| [Session manager](../src/services/auth/session.ts) | Pemulihan serta pembersihan sesi lokal |
| [Auth provider](../src/providers/auth-provider.tsx) | State autentikasi, logout, dan pemeriksaan expiry |
| [Service profil](../src/services/auth/profile.ts) | Cache profil, perbaikan cache, serta numeric employee ID |
| [Protected route](../src/routes/protected-route.tsx) | Penjagaan halaman privat dan penantian profil |
| [Public route](../src/routes/public-route.tsx) | Redirect pengguna dengan sesi lokal aktif |
| [Deklarasi route](../src/routes/index.tsx) | Route sign in dan landing page |
| [Service logout](../src/services/auth/logout.ts) dan [menu akun](../src/components/nav-user.tsx) | Pemanggilan SSO logout, pembersihan, dan navigasi |
| [Tipe autentikasi](../src/types/auth.ts) dan [konstanta](../src/lib/constants.ts) | Envelope respons, identitas, profil, serta indikator sukses |
| [Konfigurasi environment](../src/lib/env.ts) dan [contoh environment](../.env.example) | Pemetaan konfigurasi aplikasi |
