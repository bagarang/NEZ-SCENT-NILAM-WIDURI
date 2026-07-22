## 9. Changelog — Update Permintaan Boss

Update berikut sudah diterapkan ke semua modul terkait (Task, PI, SO):

1. **Task → Actual Date** sekarang otomatis diambil dari tanggal Activity
   terakhir untuk agen yang sama (bukan input manual lagi). Tampil sebagai
   kolom read-only di list Task.
2. **Status PI** tidak lagi dropdown manual — otomatis **"Belum SO"** /
   **"Sudah SO"**, dihitung dari ada-tidaknya SO yang link ke nomor PI itu.
3. **Sales Order → Linked Nomor PI**: setelah pilih Contact Agen, pilihan
   PI otomatis hanya menampilkan PI milik agen itu. Pilih PI-nya, **Amount
   otomatis terisi** dari nominal PI tersebut (masih bisa diedit manual
   untuk kasus split payment).
4. **Terms** otomatis terisi default **"30 Hari"** saat menambah SO baru
   (tetap bisa diubah).
5. Dropdown Linked Nomor PI di form SO **hanya menampilkan PI yang belum
   dipakai SO lain** ("Belum SO"); PI yang sudah "Sudah SO" tidak muncul
   lagi sebagai pilihan (kecuali PI yang sedang dipakai SO yang sedang
   diedit).
6. **Status Klien** di form/list SO dihapus, diganti kolom **"Sisa Hari"**
   (Days Until Due). Kalau Due Date sudah lewat, Status otomatis tampil
   **"Overdue"** berwarna merah.
7. Kolom **"Tanggal"** di list & Dashboard Sales Order sekarang menampilkan
   **Due Date** (bukan SO Date lagi), sekaligus jadi patokan urutan list
   (paling mendesak di atas).
8. List SO menampilkan kolom **Sisa Hari (Days Until Due)**; SO yang lewat
   due date langsung tampil badge **Overdue** merah supaya gampang
   di-follow-up.
9. Saat **Payment Date** diisi di form SO, **Status otomatis jadi "Paid"**.
10. Kolom **Notes** ditambahkan sebagai header baru di list Sales Order,
    jadi kalau Status = **Split Payment**, detail informasinya kelihatan
    langsung dari list tanpa buka form.
11. Form Proforma Invoice disederhanakan:
    - Field **Deal Name** dan **Payment Date** dihapus dari form.
    - Field **Sales Rep** di-relabel jadi **Admin**.
    - Field **Status Klien** dihapus.
    - Kolom **Notes** sekarang ditampilkan di list Proforma Invoice.

> Kolom lama (`Deal Name`, `Payment Date` di PI; `Status Klien`/`CLIENT
> STATUS` di PI & SO) tetap ada di Sheet untuk kompatibilitas data lama,
> hanya saja tidak lagi diisi/ditampilkan lewat web app.

**Cara update:** copy ulang isi `PIService.gs`, `SOService.gs`,
`TaskService.gs`, `DashboardService.gs`, `SetupService.gs`, `Utils.gs`,
dan `JavaScript.html` ke project Apps Script kamu (timpa file lama yang
namanya sama), lalu **Deploy → Manage deployments → edit → Version: New
→ Deploy** supaya perubahan tayang di URL yang sama.

---

## 10. Changelog v3 — Update Lanjutan

1. Header list Task **"Actual Date (dari Activity)"** disederhanakan jadi
   **"Actual Date"** saja.
2. Task dengan status **Done*** kini **disembunyikan dari list Task**
   (biar list tetap bersih/fokus ke yang aktif), tapi tetap tersimpan di
   Sheet dan tetap terhitung di chart **Task Status** Dashboard.
3. Task yang **overdue** (Sisa Hari negatif) sekarang punya tombol
   **"Recreate"**: task lama otomatis ditandai **Failed** (tetap
   terhitung sebagai task gagal di Dashboard) dan task baru dibuat
   dengan data sama tapi Due Date baru. Chart Task Status Dashboard
   sekarang 3 kategori: **Scheduled / Completed / Failed**.
4. List **Activity Log** menampilkan kolom **Notes** (sebelumnya cuma
   ada di form, tidak tampil di tabel).
5. Popup **Tambah/Edit Sales Order**:
   - Field **Invoice Description dihapus**.
   - Field **Contact Agen** sekarang berupa **kotak pencarian** (ketik
     nama/kode agen, muncul daftar hasil pencarian, klik untuk pilih) —
     bukan cuma dropdown biasa. Setelah pilih, daftar Linked Nomor PI
     otomatis mengikuti agen yang dipilih (perilaku lama tetap jalan).

**File yang berubah di update ini:** `TaskService.gs`,
`DashboardService.gs`, `SOService.gs`, `JavaScript.html`,
`Stylesheet.html`. Timpa isinya ke project Apps Script kamu, lalu
**Deploy → Manage deployments → New version → Deploy**.

---

## 11. Changelog v4 — Search Box untuk Semua Dropdown Agen/PI

Field yang tadinya cuma dropdown `<select>` biasa (harus di-scroll),
sekarang jadi **kotak ketik + cari** (search combo): ketik nama/kode
agen atau nomor PI, hasil muncul di bawahnya, klik untuk pilih.

Diterapkan di:
- **Activity Log** → Contact Agen
- **Task Tracker** → Contact Agen
- **Proforma Invoice** → Contact Agen
- **Gifts** → Penerima (Agen)
- **Sales Order** → Contact Agen **dan** Linked Nomor PI (dua-duanya
  sekarang bisa diketik, bukan cuma Contact Agen seperti sebelumnya)

> Catatan soal **"No PI" yang tidak ada di Activity Log**: itu memang
> disengaja. Activity Log dipakai untuk mencatat aktivitas komunikasi ke
> agen (telepon, kunjungan, dsb), bukan transaksi invoice — jadi tidak
> ada field Nomor PI di sana. No PI hanya relevan di modul Proforma
> Invoice & Sales Order. Kalau ke depannya mau ada fitur "link Activity
> ke PI tertentu", tinggal bilang, nanti saya tambahkan.

**File yang berubah:** `JavaScript.html` saja (tambah helper
`searchComboHtml_` / `wireSearchCombo_`, field type baru
`search-select`, dan form Sales Order dirombak pakai helper ini).
Timpa file itu ke project Apps Script → **Deploy → Manage deployments →
New version → Deploy**.

---

## 12. Changelog v5 — Konversi ke Standalone (Netlify) + Tema Orange & Peach

- **Arsitektur diubah**: tampilan (HTML/CSS/JS) dipisah total dari Apps
  Script, sekarang di-hosting sendiri (Netlify). Apps Script jadi API
  JSON murni lewat `doPost` + whitelist `API_FUNCTIONS` (lihat
  `Code.gs` baru).
- **Tema visual dirombak**: dari ungu terang → **orange terracotta +
  peach hangat**, pakai font **Fraunces** (judul, kesan elegan) +
  **Plus Jakarta Sans** (isi). Semua warna chart, badge, sidebar, dsb
  disesuaikan.
- **Semua fitur & logic tetap sama persis** — tidak ada modul yang
  hilang atau berubah perilaku. Yang berubah cuma cara frontend
  "ngobrol" ke server (`fetch()` menggantikan `google.script.run`) dan
  tampilannya.
- Detail teknis, cara deploy, dan troubleshooting ada di `README.md` di
  root folder ini.

---

## 13. Changelog v6 — Update Lanjutan (Task, Activity, SO, Lookup, Dashboard)

1. **Recreate Task**: paragraf keterangan panjang di popup-nya dihapus,
   sekarang cuma judul + isian Due Date baru + tombol.
2. **Activity Log**: field & kolom **Status Klien dihapus total** (form
   maupun list) — sudah tidak dipakai lagi.
3. **Sales Order**: 2 baris keterangan kecil (di bawah "Linked Nomor PI"
   dan di bawah form/Notes) dihapus dari popup Tambah/Edit.
4. **Agen Lookup**:
   - Bagian **Recent Proforma Invoice** (dan sekalian Recent Activity,
     Recent Sales Order, Gifts) sekarang tampil sebagai **tabel**, kolomnya
     sama persis dengan tab aslinya masing-masing (termasuk badge status
     otomatis Belum SO/Sudah SO, Overdue merah, dsb) — bukan lagi daftar
     baris sederhana.
   - Kolom pilih agen sekarang jadi **search box** (ketik untuk cari),
     sama seperti field agen di form-form lain.
5. **Dashboard**:
   - Ditambahkan **filter Tanggal Mulai & Tanggal Akhir** di atas halaman.
     Kalau diterapkan, Top 5 PI/SO, Status SO, Task Status, dan semua
     daftar "Recent" ikut menyesuaikan rentang itu. KPI "Total Agen" &
     "Activities Last 7/30 Days" sengaja tetap dari data penuh (bukan
     metrik yang cocok difilter rentang custom). Ada tombol **Reset**
     untuk kembali ke tampilan semua data.
   - 3 KPI baru: **Target Kontak / Bulan**, **Realisasi Kontak** (ikut
     filter tanggal kalau ada, default bulan berjalan kalau tidak), dan
     **% Pencapaian Kontak** (warna otomatis: hijau ≥100%, kuning
     70-99%, merah <70%). Target diatur di menu **Setup** (khusus
     Manager) — field baru "Target Kontak per Bulan", default 50 saat
     setup awal.

**File yang berubah:**
- Backend: `Config.gs`, `Utils.gs`, `SetupService.gs`, `ActivityService.gs`
  (sebenarnya sudah lebih dulu, lihat catatan), `LookupService.gs`,
  `DashboardService.gs`, `Installer.gs`, `Code.gs` (whitelist endpoint baru).
- Frontend: `app.js` saja.

**Cara update:** timpa semua file di atas ke project Apps Script kamu →
**Deploy → Manage deployments → New version → Deploy**. Lalu jalankan
ulang `runInitialSetup` sekali (aman dijalankan berkali-kali) supaya
kolom "Target Kontak / Bulan" dan default nilainya otomatis dibuat.
Untuk frontend, drag & drop ulang folder `netlify-frontend` yang sudah
diperbarui ke situs Netlify kamu.

---

## 14. Changelog v7 — Backend Disederhanakan jadi 1 File

Sebelumnya `apps-script-backend/` isinya 14 file `.gs` terpisah (harus
dibuat satu-satu di editor Apps Script) — sekarang digabung jadi
**1 file `Code.gs` saja**. Tidak ada perubahan logic/fitur sama sekali,
murni penggabungan file supaya setup awal jauh lebih cepat: cukup
copy-paste 1 kali, tidak perlu bikin belasan file manual.

Kalau sebelumnya sudah sempat setup versi banyak-file, tinggal hapus
semua file lama itu di editor Apps Script, sisakan satu `Code.gs`, lalu
paste isi file gabungan yang baru.

---

## 15. Changelog v8 — Approval Recreate, Link Screenshot, Download Report, Detail Notes, Logo Loading

1. **Task → Recreate sekarang butuh persetujuan Sales Manager**:
   - Tombol **Recreate** di task overdue (misal Visit Plan Zahra) sekarang
     mengajukan **permintaan**, bukan langsung membuat task baru.
   - Sales Manager dapat **notifikasi** (badge angka merah di menu sidebar
     "Tasks") dan panel **"Permintaan Recreate Menunggu Persetujuan"** di
     atas halaman Task Tracker, lengkap tombol **Confirm** / **Decline**.
   - Kalau **Confirm**: baru task lama ditandai **Failed** dan task baru
     dibuat dengan Due Date baru — tetap **2 baris data** (overdue lama +
     scheduled baru), tidak ada yang ditimpa/di-replace, sama seperti
     perilaku Recreate sebelumnya.
   - Kalau **Decline**: tidak ada perubahan apa pun ke Task.
   - Permintaan tersimpan di sheet baru **`RecreateRequests`** (dibuat
     otomatis saat `runInitialSetup` dijalankan ulang).
2. **Activity Log**: field baru **"Link Screenshot"** di popup Tambah/Edit
   (kolom I baru di Sheet Activity). Dipakai untuk KPI baru di Dashboard:
   **"Kepatuhan Foto"** — persentase Activity yang sudah melampirkan link
   screenshot dari total Activity (ikut filter tanggal Dashboard kalau ada).
3. **Dashboard**: tombol **"Download Report"** di pojok kanan atas (sebelah
   filter tanggal) — mengunduh 1 file **CSV** berisi semua data yang tampil
   di Dashboard (KPI, Top 5, status, task status, kontak, kepatuhan foto,
   dan semua daftar "Recent"), bisa langsung dibuka di Excel/Google Sheets.
4. **Activity Log**: tombol baru **"Lihat"** di tiap baris — membuka panel
   detail yang menampilkan isi **Notes lengkap** (tidak dipotong seperti di
   kolom list) beserta Link Screenshot-nya (kalau ada, bisa diklik).
5. **Halaman loading pertama** (sebelum app.js selesai render) sekarang
   menampilkan **logo Nez Scent** di atas spinner-nya.

**File yang berubah:**
- Backend: `Code.gs` (kolom baru di Activity, sheet baru
  `RecreateRequests`, endpoint baru `apiRequestRecreateTask` /
  `apiListRecreateRequests` / `apiDecideRecreateTask`, KPI Kepatuhan Foto
  di `apiGetDashboard`).
- Frontend: `app.js`, `styles.css`, `index.html`, dan file baru `logo.png`
  (taruh di folder `netlify-frontend` yang sama dengan `index.html`).

**Cara update:**
1. Timpa `Code.gs` ke project Apps Script → **Deploy → Manage deployments
   → New version → Deploy**.
2. Jalankan ulang **`runInitialSetup`** sekali dari editor Apps Script
   (aman dijalankan berkali-kali) supaya sheet `RecreateRequests` dan
   kolom "LINK SCREENSHOT" di Activity otomatis dibuat.
3. Drag & drop ulang folder `netlify-frontend` (sudah termasuk `logo.png`)
   ke halaman **Deploys** situs Netlify kamu.
