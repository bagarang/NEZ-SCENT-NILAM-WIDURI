# Nez Scent Agen Dashboard — Versi Standalone (Netlify + 1 File Apps Script)

**Spreadsheet = database.** **Apps Script = 1 file doang**, cuma jembatan
API. **Tampilan (HTML/CSS/JS) = situs sendiri**, di-hosting di Netlify.
Tema: orange terracotta & peach.

```
nez-scent-standalone/
├── apps-script-backend/
│   └── Code.gs              <- SATU FILE INI SAJA, paste ke Apps Script
└── netlify-frontend/        <- drag & drop ke Netlify
    ├── index.html
    ├── styles.css
    ├── app.js
    └── netlify.toml
```

Data yang diinput lewat website ini **langsung tersimpan di
Spreadsheet** (sheet Agen/Tasks/Activity/PI/SO/Gifts/Users/Setup) —
bukan disimpan di komputer/browser kamu. Jadi bisa dibuka dan dipakai
bareng-bareng dari HP/laptop mana saja, datanya tetap satu sumber
(shared), bukan lokal.

---

## 1. Setup Backend (5 menit, cuma 1 file)

1. Buka spreadsheet Nez Scent → **Extensions → Apps Script**.
2. Kalau ada file lama (`Code.gs`, `Config.gs`, `Utils.gs`, dst — dari
   versi sebelumnya yang banyak file), **hapus semua**, sisakan cuma
   satu file `Code.gs` kosong.
3. Buka `apps-script-backend/Code.gs` dari paket ini, **copy semua
   isinya**, paste ke `Code.gs` di editor Apps Script. Simpan (Ctrl+S).
4. Di toolbar atas, pilih fungsi **`runInitialSetup`** dari dropdown →
   klik **Run ▶**.
5. Muncul minta izin → **Review permissions** → pilih akun Google kamu
   → **Advanced → Buka (nama project) → Allow**.
6. Muncul popup "Setup selesai!" → berarti Sheet `Users` sudah dibuat
   otomatis dengan akun awal:
   - `manager` / `manager123` (role Manager, akses semua)
   - `zahra` / `zahra123` (role Staff, tanpa akses Setup/Users)
7. **Deploy → New deployment**:
   - Klik ikon gear ⚙️ → pilih **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
8. **Copy URL-nya** (harus diakhiri `/exec`).
9. Tes: buka URL itu di tab baru → harus muncul
   `{"ok":true,"message":"Nez Scent API aktif..."}`. Kalau muncul,
   backend siap — **selesai, tidak perlu bikin file lain lagi.**

---

## 2. Sambungkan Frontend ke Backend

1. Buka `netlify-frontend/app.js` pakai text editor apa saja.
2. Baris paling atas:
   ```js
   var API_URL = 'PASTE_URL_WEB_APP_APPS_SCRIPT_KAMU_DI_SINI';
   ```
3. Ganti dengan URL dari Langkah 1 poin 8, contoh:
   ```js
   var API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Simpan.

---

## 3. Deploy Frontend ke Netlify

1. Buka [app.netlify.com](https://app.netlify.com) → login (boleh pakai akun Google).
2. Cari kotak **"Deploy manually"** (drag & drop area) di dashboard.
3. **Drag folder `netlify-frontend`** (bukan folder `nez-scent-standalone` besar!) ke situ.
4. Dapat URL publik, contoh `https://nama-acak.netlify.app` — itu situs kamu.
5. Buka, login, coba tambah data — cek juga langsung ke Spreadsheet, harus muncul baris baru di situ.

**Update di kemudian hari:** ubah lagi `app.js`/`styles.css` → drag & drop ulang folder `netlify-frontend` ke halaman **Deploys** situs Netlify yang sama.

---

## 4. Kalau Mau Update Backend Nanti

Karena sekarang cuma 1 file, updatenya juga simpel:
1. Buka `apps-script-backend/Code.gs` versi terbaru yang saya kasih.
2. Copy semua isinya.
3. Di editor Apps Script, buka file `Code.gs` → select all (Ctrl+A) → hapus → paste yang baru.
4. **Deploy → Manage deployments → pensil → New version → Deploy.**

Tidak perlu bongkar-pasang banyak file lagi.

---

## 5. Troubleshooting

| Masalah | Solusi |
|---|---|
| Halaman putih / stuck loading | F12 → Console → cek `API_URL` di `app.js` sudah benar & diakhiri `/exec` |
| Error CORS di Console | Pastikan Web App di-deploy dengan **Who has access: Anyone** |
| Data tidak masuk ke Spreadsheet | Cek nama-nama sheet (Agen, Tasks, Activity, PI, SO, Gifts, Setup, Users) di spreadsheet kamu sama persis dengan yang didefinisikan (lihat bagian `SHEETS` di awal `Code.gs`) |
| Login gagal terus | Jalankan ulang `runInitialSetup` dari editor Apps Script, atau cek Sheet `Users` |
| 404 Page Not Found di Netlify | Yang di-drag harus folder `netlify-frontend` isinya langsung (`index.html` dkk), bukan folder `nez-scent-standalone` yang besar |

---

## 6. Fitur

Lengkap: Dashboard (dengan filter tanggal + target/realisasi/%
pencapaian kontak), Agen, Tasks (Recreate & Actual Date otomatis),
Activity Log, Proforma Invoice, Sales Order (search Contact Agen &
Linked PI, auto status Paid/Overdue), Gifts, Agen Lookup (tampilan
tabel sesuai tab asal + search), Setup, dan Users. Riwayat lengkap
perubahan ada di `CHANGELOG.md`.
