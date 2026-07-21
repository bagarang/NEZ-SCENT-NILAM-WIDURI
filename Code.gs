/**
 * =====================================================================================
 * NEZ SCENT — DATABASE BACKEND (Google Apps Script, 1 FILE)
 * =====================================================================================
 * Spreadsheet ini adalah database-nya. File ini cuma jembatan API (JSON) supaya
 * frontend (Netlify) bisa baca/tulis ke Spreadsheet dari mana saja - bukan cuma
 * dari komputer kamu (jadi database-nya "shared", bukan lokal).
 *
 * CARA PAKAI (sekali saja):
 *   1) Buka spreadsheet Nez Scent -> Extensions -> Apps Script
 *   2) Hapus isi Code.gs bawaan, paste SEMUA isi file ini di situ
 *   3) Jalankan fungsi "runInitialSetup" sekali (Run -> pilih fungsi ini)
 *   4) Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone
 *   5) Copy URL yang diakhiri /exec, tempel ke API_URL di app.js (folder netlify-frontend)
 *
 * Detail lengkap ada di README.md.
 * =====================================================================================
 */



/* ============================== Config ============================== */


/**
 * ===================================================================
 * CONFIG.GS
 * Konfigurasi terpusat: nama sheet, baris header, kolom, dsb.
 * Kalau struktur spreadsheet berubah, cukup ubah di sini.
 * ===================================================================
 */

// ID spreadsheet database. Kosongkan ('') jika script di-bind langsung
// ke spreadsheet (Extensions > Apps Script dari dalam Sheet).
var SPREADSHEET_ID = '';

function getDB_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

// Nama-nama sheet
var SHEETS = {
  SETUP: 'Setup',
  DASHBOARD: 'Dashboard',
  AGEN: 'Agen',
  TASKS: 'Tasks',
  ACTIVITY: 'Activity',
  PI: 'PI',
  SO: 'SO',
  GIFTS: 'Gifts',
  LOOKUP: 'Lookup',
  USERS: 'Users'
};

/**
 * Definisi tabel: header row, baris awal data, kolom terakhir, dan
 * peta nama field -> nomor kolom (1 = A, 2 = B, dst).
 */
var TABLES = {
  AGEN: {
    sheet: SHEETS.AGEN,
    headerRow: 4,
    dataStart: 5,
    lastCol: 13, // M
    cols: {
      contactId: 2,        // B
      namaAgen: 3,          // C
      contactPerson: 4,     // D
      jobTitle: 5,           // E
      phone: 6,               // F
      locationPublic: 7,       // G
      shippingAddress: 8,       // H
      expedisi: 9,                // I
      status: 10,                   // J
      pic: 11,                        // K
      preferredContact: 12,             // L
      kodeKontak: 13                      // M
    }
  },
  TASKS: {
    sheet: SHEETS.TASKS,
    headerRow: 5,
    dataStart: 6,
    lastCol: 11, // K
    cols: {
      contactPerson: 2, // B (kode kontak agen)
      agen: 3,           // C
      admin: 4,           // D
      dueDate: 5,          // E
      actualDate: 6,        // F
      priority: 7,           // G
      status: 8,               // H
      poin: 9,                   // I
      daysUntilDue: 10,           // J
      kategori: 11                  // K (kolom baru)
    }
  },
  ACTIVITY: {
    sheet: SHEETS.ACTIVITY,
    headerRow: 4,
    dataStart: 5,
    lastCol: 8, // H
    cols: {
      contactPerson: 2, // B
      agen: 3,           // C
      date: 4,             // D
      admin: 5,              // E
      contactMethod: 6,       // F
      notes: 7,                 // G
      clientStatus: 8            // H
    }
  },
  PI: {
    sheet: SHEETS.PI,
    headerRow: 5,
    dataStart: 6,
    lastCol: 13, // M
    cols: {
      nomorPI: 2,      // B
      dealName: 3,      // C
      contactPerson: 4,  // D
      agen: 5,             // E
      salesRep: 6,           // F
      dealValue: 7,            // G
      piDate: 8,                 // H
      paymentDate: 9,              // I
      lastUpdated: 10,               // J
      notes: 11,                       // K
      clientStatus: 12,                  // L
      statusPI: 13                         // M (kolom baru)
    }
  },
  SO: {
    sheet: SHEETS.SO,
    headerRow: 5,
    dataStart: 6,
    lastCol: 14, // N
    cols: {
      soNumber: 2,     // B
      contactPerson: 3,  // C
      agen: 4,             // D
      linkedPI: 5,           // E
      description: 6,          // F
      amount: 7,                 // G
      status: 8,                   // H
      terms: 9,                      // I
      soDate: 10,                      // J
      dueDate: 11,                       // K
      paymentDate: 12,                     // L
      notes: 13,                             // M
      clientStatus: 14                         // N
    }
  },
  GIFTS: {
    sheet: SHEETS.GIFTS,
    headerRow: 5,
    dataStart: 6,
    lastCol: 8, // H
    cols: {
      recipient: 2, // B (kode kontak agen)
      clientCompany: 3, // C
      salesRep: 4,        // D
      description: 5,       // E
      value: 6,               // F
      deliveryDate: 7,          // G
      notes: 8                    // H
    }
  },
  USERS: {
    sheet: SHEETS.USERS,
    headerRow: 1,
    dataStart: 2,
    lastCol: 5,
    cols: {
      username: 1, // A
      passwordHash: 2, // B
      fullName: 3,       // C
      role: 4,             // D  ('Manager' | 'Staff')
      status: 5               // E ('Active' | 'Inactive')
    }
  }
};

// Kolom variabel dropdown di Sheet Setup (row 6 ke bawah)
var SETUP_LISTS = {
  companyName: { col: 2, single: true },       // B6
  statusAgen: { col: 4 },                       // D6:D...
  metodeKontak: { col: 6 },                      // F6:F...
  pic: { col: 8 },                                 // H6:H...
  statusTransaksi: { col: 10 },                      // J6:J... (PI/SO status)
  taskCategories: { col: 12 },                         // L6:L...
  // Kolom 46 (AT) sengaja dipilih jauh dari kolom lama (N..AB) yang dulu
  // dipakai formula QUERY/COUNTIF bawaan spreadsheet, supaya tidak bentrok.
  targetKontak: { col: 46, single: true }              // AT6 - Target Kontak per Bulan
};
var SETUP_LIST_START_ROW = 6;

// Role yang boleh mengakses tab Setup & Users
var MANAGER_ROLE = 'Manager';
var STAFF_ROLE = 'Staff';

// Lama sesi login (dalam detik) - 8 jam
var SESSION_DURATION_SEC = 8 * 60 * 60;


/* ============================== Utils ============================== */


/**
 * ===================================================================
 * UTILS.GS
 * Helper generik untuk baca/tulis sheet berbasis definisi TABLES,
 * plus fungsi bantu lain (format tanggal, generate ID, dsb).
 * ===================================================================
 */

/**
 * Cari baris terakhir yang BENAR-BENAR ada isinya di suatu kolom, dengan
 * cara "loncat" dari baris paling bawah lalu scan ke atas sampai ketemu
 * cell terisi (Range.getNextDataCell) - jauh lebih cepat dibanding
 * sheet.getLastRow(), yang sering "ketipu" oleh baris kosong berformat
 * sisa template lama (bisa ribuan baris) dan bikin setiap pembacaan data
 * jadi lambat.
 */
function findLastDataRow_(sheet, col, dataStart) {
  var maxRows = sheet.getMaxRows();
  if (maxRows < dataStart) return dataStart - 1;
  var cell = sheet.getRange(maxRows, col).getNextDataCell(SpreadsheetApp.Direction.UP);
  var row = cell.getRow();
  return row < dataStart ? dataStart - 1 : row;
}

/**
 * Ambil seluruh baris data dari sebuah tabel sebagai array of object.
 * Setiap object otomatis punya properti _row = nomor baris di sheet
 * (dipakai untuk update/delete).
 */
function readTable_(tableDef) {
  var sheet = getDB_().getSheetByName(tableDef.sheet);
  if (!sheet) return [];
  var fields = Object.keys(tableDef.cols);
  var firstCol = tableDef.cols[fields[0]];
  var lastRow = findLastDataRow_(sheet, firstCol, tableDef.dataStart);
  if (lastRow < tableDef.dataStart) return [];

  var numRows = lastRow - tableDef.dataStart + 1;
  var range = sheet.getRange(tableDef.dataStart, 1, numRows, tableDef.lastCol);
  var values = range.getValues();

  var result = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    // Lewati baris yang benar-benar kosong (kolom kedua kosong)
    var firstColIdx = firstCol - 1;
    if (row[firstColIdx] === '' || row[firstColIdx] === null) continue;

    var obj = { _row: tableDef.dataStart + i };
    for (var f = 0; f < fields.length; f++) {
      var colIdx = tableDef.cols[fields[f]] - 1;
      obj[fields[f]] = normalizeCell_(row[colIdx]);
    }
    result.push(obj);
  }
  return result;
}

function normalizeCell_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return val;
}

/**
 * Tambah baris baru ke tabel. `obj` berisi field sesuai tableDef.cols.
 * Mengembalikan nomor baris baru.
 */
function appendToTable_(tableDef, obj) {
  var sheet = getDB_().getSheetByName(tableDef.sheet);
  var fields = Object.keys(tableDef.cols);
  var firstCol = tableDef.cols[fields[0]];
  var lastDataRow = findLastDataRow_(sheet, firstCol, tableDef.dataStart);
  var newRow = Math.max(lastDataRow + 1, tableDef.dataStart);
  writeRow_(sheet, tableDef, newRow, obj);
  return newRow;
}

/**
 * Update baris tertentu (berdasar obj._row) dengan field-field baru.
 * Field yang tidak ada di obj tidak akan ditimpa.
 */
function updateTableRow_(tableDef, rowIndex, obj) {
  var sheet = getDB_().getSheetByName(tableDef.sheet);
  writeRow_(sheet, tableDef, rowIndex, obj, true);
}

function writeRow_(sheet, tableDef, rowIndex, obj, partial) {
  var fields = Object.keys(tableDef.cols);
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (partial && !obj.hasOwnProperty(f)) continue;
    var col = tableDef.cols[f];
    var val = obj[f];
    if (val === undefined) val = '';
    sheet.getRange(rowIndex, col).setValue(val);
  }
}

function deleteTableRow_(tableDef, rowIndex) {
  var sheet = getDB_().getSheetByName(tableDef.sheet);
  sheet.deleteRow(rowIndex);
}

/**
 * Ambil daftar nilai dropdown dari Sheet Setup untuk satu kategori.
 * excludeAll = true akan membuang opsi "All" (dipakai untuk form input,
 * bukan filter).
 */
function getSetupList_(key, excludeAll) {
  var def = SETUP_LISTS[key];
  if (!def) return [];
  var sheet = getDB_().getSheetByName(SHEETS.SETUP);
  if (def.single) {
    return [sheet.getRange(SETUP_LIST_START_ROW, def.col).getValue()];
  }
  var lastRow = sheet.getRange(SETUP_LIST_START_ROW, def.col, 100, 1)
    .getValues()
    .reduce(function (lastNonEmpty, val, idx) {
      return (val[0] !== '' && val[0] !== null) ? SETUP_LIST_START_ROW + idx : lastNonEmpty;
    }, SETUP_LIST_START_ROW - 1);

  if (lastRow < SETUP_LIST_START_ROW) return [];
  var values = sheet.getRange(SETUP_LIST_START_ROW, def.col, lastRow - SETUP_LIST_START_ROW + 1, 1)
    .getValues()
    .map(function (r) { return r[0]; })
    .filter(function (v) { return v !== '' && v !== null; });

  if (excludeAll) {
    values = values.filter(function (v) { return String(v).toLowerCase() !== 'all'; });
  }
  return values;
}

/** Simpan ulang seluruh isi list dropdown (dipakai halaman Setup). */
function setSetupList_(key, items) {
  var def = SETUP_LISTS[key];
  if (!def || def.single) throw new Error('List tidak bisa diubah dengan cara ini.');
  var sheet = getDB_().getSheetByName(SHEETS.SETUP);

  // Bersihkan kolom (100 baris ke bawah) lalu tulis ulang, "All" selalu di baris pertama.
  sheet.getRange(SETUP_LIST_START_ROW, def.col, 100, 1).clearContent();
  var out = ['All'].concat(items.filter(function (v) { return String(v).toLowerCase() !== 'all'; }));
  sheet.getRange(SETUP_LIST_START_ROW, def.col, out.length, 1)
    .setValues(out.map(function (v) { return [v]; }));
}

function setCompanyName_(name) {
  var sheet = getDB_().getSheetByName(SHEETS.SETUP);
  sheet.getRange(SETUP_LIST_START_ROW, SETUP_LISTS.companyName.col).setValue(name);
}

/** Simpan nilai tunggal (single:true) di Sheet Setup, misal Target Kontak per Bulan. */
function setSingleSetupValue_(key, value) {
  var def = SETUP_LISTS[key];
  if (!def || !def.single) throw new Error('Field ini bukan nilai tunggal.');
  var sheet = getDB_().getSheetByName(SHEETS.SETUP);
  sheet.getRange(SETUP_LIST_START_ROW, def.col).setValue(value);
}

/** Generate ID kontak baru, format NEZ_0001, NEZ_0002, dst. */
function generateContactId_() {
  var rows = readTable_(TABLES.AGEN);
  var maxNum = 0;
  rows.forEach(function (r) {
    var m = /NEZ_(\d+)/.exec(r.contactId || '');
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  var next = maxNum + 1;
  return 'NEZ_' + ('0000' + next).slice(-4);
}

/** Generate nomor PI baru mengikuti pola DNW/PI/{seq}K{YY}/NEZ */
function generatePINumber_() {
  var rows = readTable_(TABLES.PI);
  var maxSeq = 0;
  rows.forEach(function (r) {
    var m = /DNW\/PI\/(\d+)K\d+\/NEZ/.exec(r.nomorPI || '');
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  });
  var next = maxSeq + 1;
  var yy = String(new Date().getFullYear()).slice(-2);
  return 'DNW/PI/' + ('000' + next).slice(-3) + 'K' + yy + '/NEZ';
}

/** Generate nomor SO baru mengikuti pola SO/{seq}/{YY}/NEZ */
function generateSONumber_() {
  var rows = readTable_(TABLES.SO);
  var maxSeq = 0;
  rows.forEach(function (r) {
    var m = /SO\/(\d+)\/\d+\/NEZ/.exec(r.soNumber || '');
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  });
  var next = maxSeq + 1;
  var yy = String(new Date().getFullYear()).slice(-2);
  return 'SO/' + ('000' + next).slice(-3) + '/' + yy + '/NEZ';
}

function todayStr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
}

function daysBetween_(dateStr) {
  if (!dateStr) return '';
  var due = new Date(dateStr);
  var today = new Date(todayStr_());
  var diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  return diff;
}

/** Bungkus semua endpoint publik dengan try/catch supaya error rapi di client. */
function safeCall_(fn) {
  try {
    return { ok: true, data: fn() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* ---------------------------------------------------------------
 * Status turunan PI <-> SO (dipakai PIService, SOService, DashboardService)
 * ------------------------------------------------------------- */

/** Set nomor PI mana saja yang sudah dipakai (linked) oleh sebuah SO. */
function computeSOLinkedSet_(soList) {
  var set = {};
  soList.forEach(function (s) { if (s.linkedPI) set[s.linkedPI] = true; });
  return set;
}

/** Status PI otomatis: 'Sudah SO' kalau nomor PI-nya sudah dipakai di SO manapun. */
function computePIDisplayStatus_(piRow, linkedSet) {
  return linkedSet[piRow.nomorPI] ? 'Sudah SO' : 'Belum SO';
}

/**
 * Status SO otomatis:
 *  - Payment Date terisi -> 'Paid'
 *  - Due Date sudah lewat & belum Paid -> 'Overdue'
 *  - Selain itu -> status manual yang dipilih user (Pending/Split Payment/dst)
 */
function computeSODisplayStatus_(soRow) {
  if (soRow.status === 'Paid') return 'Paid';
  if (soRow.dueDate) {
    var due = new Date(soRow.dueDate);
    var today = new Date(todayStr_());
    if (due < today) return 'Overdue';
  }
  return soRow.status || 'Pending';
}


/* ============================== Auth ============================== */


/**
 * ===================================================================
 * AUTH.GS
 * Login sederhana berbasis Sheet "Users" + token session di CacheService.
 * Setiap panggilan API dari client wajib menyertakan token yang valid.
 * ===================================================================
 */

/** Dipanggil client saat submit form login. */
function apiLogin(username, password) {
  return safeCall_(function () {
    if (!username || !password) throw new Error('Username dan password wajib diisi.');

    var users = readTable_(TABLES.USERS);
    var user = users.filter(function (u) {
      return String(u.username).toLowerCase() === String(username).toLowerCase();
    })[0];

    if (!user) throw new Error('Username tidak ditemukan.');
    if (String(user.status).toLowerCase() !== 'active') throw new Error('Akun ini nonaktif. Hubungi Sales Manager.');
    if (user.passwordHash !== hashPassword_(password)) throw new Error('Password salah.');

    var token = Utilities.getUuid();
    var session = { username: user.username, fullName: user.fullName, role: user.role };
    CacheService.getScriptCache().put('session_' + token, JSON.stringify(session), SESSION_DURATION_SEC);

    return {
      token: token,
      fullName: user.fullName,
      role: user.role,
      username: user.username
    };
  });
}

function apiLogout(token) {
  return safeCall_(function () {
    CacheService.getScriptCache().remove('session_' + token);
    return true;
  });
}

/** Ambil session dari token. Lempar error kalau tidak valid/kedaluwarsa. */
function requireSession_(token) {
  if (!token) throw new Error('Sesi tidak valid, silakan login ulang.');
  var raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) throw new Error('Sesi kedaluwarsa, silakan login ulang.');
  return JSON.parse(raw);
}

/** Sama seperti requireSession_ tapi juga memastikan role = Manager. */
function requireManager_(token) {
  var session = requireSession_(token);
  if (session.role !== MANAGER_ROLE) {
    throw new Error('Halaman ini khusus untuk Sales Manager.');
  }
  return session;
}

/** Client bisa memanggil ini untuk validasi token yang tersimpan di localStorage. */
function apiValidateSession(token) {
  return safeCall_(function () {
    return requireSession_(token);
  });
}

function hashPassword_(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + '::nezscent::salt');
  return digest.map(function (b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Jalankan SEKALI dari editor Apps Script (pilih fungsi ini lalu klik Run)
 * untuk membuat sheet "Users" pertama kali dan akun awal:
 *   - manager / manager123   (role Manager)
 *   - zahra   / zahra123     (role Staff)
 * Segera ganti password lewat menu Users setelah login pertama kali.
 */
function setupInitialUsers() {
  var db = getDB_();
  var sheet = db.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    sheet = db.insertSheet(SHEETS.USERS);
  }
  sheet.clear();
  sheet.getRange(1, 1, 1, 5).setValues([['USERNAME', 'PASSWORD_HASH', 'FULL NAME', 'ROLE', 'STATUS']]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  sheet.getRange(2, 1, 2, 5).setValues([
    ['manager', hashPassword_('manager123'), 'Sales Manager', MANAGER_ROLE, 'Active'],
    ['zahra', hashPassword_('zahra123'), 'Zahra', STAFF_ROLE, 'Active']
  ]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 5);
  SpreadsheetApp.getUi().alert('Sheet "Users" siap. Login awal:\nmanager / manager123\nzahra / zahra123');
}


/* ============================== SetupService ============================== */


/**
 * ===================================================================
 * SETUPSERVICE.GS
 * Kelola variabel dropdown di Sheet Setup. Khusus role Manager untuk
 * mengubah, tapi semua role boleh membaca (dipakai isi form).
 * ===================================================================
 */

var PUBLIC_SETUP_KEYS = ['statusAgen', 'metodeKontak', 'pic', 'statusTransaksi', 'taskCategories'];

/** Dipanggil semua role untuk mengisi <select> di form-form CRUD. */
function apiGetFormOptions(token) {
  return safeCall_(function () {
    requireSession_(token);
    var out = {};
    PUBLIC_SETUP_KEYS.forEach(function (key) {
      out[key] = getSetupList_(key, true); // tanpa opsi "All"
    });
    // Task status dihasilkan dinamis: Scheduled + "Done - <metode kontak>"
    out.taskStatus = ['Scheduled'].concat(out.metodeKontak.map(function (m) { return 'Done - ' + m; }));
    out.priority = ['Low', 'Medium', 'High'];

    // Daftar agen untuk dropdown pilih kontak (kode kontak + nama)
    out.agenOptions = readTable_(TABLES.AGEN).map(function (a) {
      return { value: a.kodeKontak, label: a.kodeKontak + ' — ' + a.namaAgen, namaAgen: a.namaAgen };
    });

    // Daftar PI lengkap (untuk cascading dropdown "Linked Nomor PI" di form SO):
    // tiap PI tahu contact person pemiliknya, nominal dealnya, dan apakah
    // sudah dipakai (linked) oleh SO lain atau belum.
    var soListForPI = readTable_(TABLES.SO);
    var linkedSet = computeSOLinkedSet_(soListForPI);
    out.piList = readTable_(TABLES.PI).map(function (p) {
      return {
        nomorPI: p.nomorPI,
        contactPerson: p.contactPerson,
        agen: p.agen,
        dealValue: p.dealValue,
        status: computePIDisplayStatus_(p, linkedSet)
      };
    });

    out.companyName = getSetupList_('companyName', false)[0] || '';
    out.targetKontak = Number(getSetupList_('targetKontak', false)[0]) || 0;
    return out;
  });
}

/** Khusus halaman Setup (Manager): ambil semua list beserta "All". */
function apiGetSetupLists(token) {
  return safeCall_(function () {
    requireManager_(token);
    var out = {
      companyName: getSetupList_('companyName', false)[0] || '',
      targetKontak: Number(getSetupList_('targetKontak', false)[0]) || 0
    };
    PUBLIC_SETUP_KEYS.forEach(function (key) {
      out[key] = getSetupList_(key, false);
    });
    return out;
  });
}

function apiSaveSetupList(token, key, items) {
  return safeCall_(function () {
    requireManager_(token);
    if (PUBLIC_SETUP_KEYS.indexOf(key) === -1) throw new Error('List tidak dikenal.');
    var cleaned = items.map(function (v) { return String(v).trim(); }).filter(function (v) { return v; });
    setSetupList_(key, cleaned);
    return true;
  });
}

function apiSaveCompanyName(token, name) {
  return safeCall_(function () {
    requireManager_(token);
    if (!name) throw new Error('Nama perusahaan tidak boleh kosong.');
    setCompanyName_(name);
    return true;
  });
}

/** Target Kontak per Bulan - dipakai untuk hitung "% Pencapaian Kontak" di Dashboard. */
function apiSaveTargetKontak(token, value) {
  return safeCall_(function () {
    requireManager_(token);
    var n = Number(value);
    if (isNaN(n) || n < 0) throw new Error('Target harus berupa angka positif.');
    setSingleSetupValue_('targetKontak', n);
    return true;
  });
}


/* ============================== UserService ============================== */


/**
 * ===================================================================
 * USERSERVICE.GS
 * CRUD akun user. Hanya bisa diakses role Manager.
 * ===================================================================
 */

function apiListUsers(token) {
  return safeCall_(function () {
    requireManager_(token);
    return readTable_(TABLES.USERS).map(function (u) {
      return { _row: u._row, username: u.username, fullName: u.fullName, role: u.role, status: u.status };
    });
  });
}

function apiSaveUser(token, payload) {
  return safeCall_(function () {
    requireManager_(token);
    if (!payload.username || !payload.fullName || !payload.role) {
      throw new Error('Username, Nama, dan Role wajib diisi.');
    }
    if (['Manager', 'Staff'].indexOf(payload.role) === -1) {
      throw new Error('Role tidak valid.');
    }

    var existing = readTable_(TABLES.USERS);
    var dup = existing.filter(function (u) {
      return String(u.username).toLowerCase() === String(payload.username).toLowerCase() && u._row !== payload._row;
    });
    if (dup.length) throw new Error('Username sudah dipakai.');

    var obj = {
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
      status: payload.status || 'Active'
    };
    if (payload.password) {
      obj.passwordHash = hashPassword_(payload.password);
    }

    if (payload._row) {
      updateTableRow_(TABLES.USERS, payload._row, obj);
      return { _row: payload._row };
    } else {
      if (!payload.password) throw new Error('Password wajib diisi untuk user baru.');
      var row = appendToTable_(TABLES.USERS, obj);
      return { _row: row };
    }
  });
}

function apiDeleteUser(token, rowIndex, currentUsername) {
  return safeCall_(function () {
    var session = requireManager_(token);
    var users = readTable_(TABLES.USERS);
    var target = users.filter(function (u) { return u._row === rowIndex; })[0];
    if (target && String(target.username).toLowerCase() === String(session.username).toLowerCase()) {
      throw new Error('Tidak bisa menghapus akun yang sedang login.');
    }
    deleteTableRow_(TABLES.USERS, rowIndex);
    return true;
  });
}


/* ============================== AgenService ============================== */


/**
 * ===================================================================
 * AGENSERVICE.GS
 * ===================================================================
 */

function apiListAgen(token) {
  return safeCall_(function () {
    requireSession_(token);
    return readTable_(TABLES.AGEN).sort(function (a, b) {
      return (a.namaAgen || '').localeCompare(b.namaAgen || '');
    });
  });
}

function apiSaveAgen(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.namaAgen || !payload.contactPerson) {
      throw new Error('Nama Agen dan Contact Person wajib diisi.');
    }

    var isNew = !payload._row;
    var contactId = isNew ? generateContactId_() : payload.contactId;

    var obj = {
      contactId: contactId,
      namaAgen: payload.namaAgen,
      contactPerson: payload.contactPerson,
      jobTitle: payload.jobTitle || '',
      phone: payload.phone || '',
      locationPublic: payload.locationPublic || '',
      shippingAddress: payload.shippingAddress || '',
      expedisi: payload.expedisi || '',
      status: payload.status || 'Active',
      pic: payload.pic || '',
      preferredContact: payload.preferredContact || '',
      kodeKontak: '[' + contactId + '] ' + payload.contactPerson
    };

    if (isNew) {
      var row = appendToTable_(TABLES.AGEN, obj);
      return { _row: row, contactId: contactId };
    } else {
      updateTableRow_(TABLES.AGEN, payload._row, obj);
      return { _row: payload._row, contactId: contactId };
    }
  });
}

function apiDeleteAgen(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.AGEN, rowIndex);
    return true;
  });
}


/* ============================== TaskService ============================== */


/**
 * ===================================================================
 * TASKSERVICE.GS
 * List Task hanya menampilkan task yang masih aktif (status "Scheduled").
 * Task yang sudah "Done*" atau "Failed" disembunyikan dari list, tapi
 * tetap ada di Sheet dan tetap terhitung di KPI Dashboard (Dashboard
 * membaca Sheet Tasks langsung, bukan lewat apiListTasks).
 * ===================================================================
 */

function apiListTasks(token) {
  return safeCall_(function () {
    requireSession_(token);

    // "Actual Date" tidak lagi diinput manual - diambil otomatis dari
    // tanggal Activity terakhir untuk kontak agen yang sama.
    var latestActivityByContact = {};
    readTable_(TABLES.ACTIVITY).forEach(function (a) {
      if (!a.contactPerson || !a.date) return;
      var cur = latestActivityByContact[a.contactPerson];
      if (!cur || new Date(a.date) > new Date(cur)) {
        latestActivityByContact[a.contactPerson] = a.date;
      }
    });

    return readTable_(TABLES.TASKS)
      .filter(function (t) { return t.status === 'Scheduled'; }) // sembunyikan Done*/Failed dari list
      .map(function (t) {
        t.daysUntilDue = daysBetween_(t.dueDate);
        t.actualDate = latestActivityByContact[t.contactPerson] || '';
        return t;
      })
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
  });
}

function apiSaveTask(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.contactPerson || !payload.dueDate) {
      throw new Error('Kontak Agen dan Due Date wajib diisi.');
    }

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === payload.contactPerson; })[0];

    // Kolom "Actual Date" sengaja tidak ditulis di sini - nilainya selalu
    // dihitung otomatis dari Sheet Activity saat data ditampilkan (lihat apiListTasks).
    var obj = {
      contactPerson: payload.contactPerson,
      agen: agen ? agen.namaAgen : (payload.agen || ''),
      admin: payload.admin || '',
      dueDate: payload.dueDate,
      priority: payload.priority || 'Medium',
      status: payload.status || 'Scheduled',
      poin: payload.poin || '',
      kategori: payload.kategori || '',
      daysUntilDue: daysBetween_(payload.dueDate)
    };

    if (payload._row) {
      updateTableRow_(TABLES.TASKS, payload._row, obj);
      return { _row: payload._row };
    } else {
      var row = appendToTable_(TABLES.TASKS, obj);
      return { _row: row };
    }
  });
}

function apiDeleteTask(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.TASKS, rowIndex);
    return true;
  });
}

/**
 * "Recreate" task yang overdue: task lama ditandai status "Failed"
 * (tetap tersimpan & terhitung sebagai task gagal di Dashboard), lalu
 * dibuatkan task baru dengan data sama tapi Due Date baru (Sisa Hari
 * otomatis kembali positif).
 */
function apiRecreateTask(token, rowIndex, newDueDate) {
  return safeCall_(function () {
    requireSession_(token);
    if (!newDueDate) throw new Error('Due Date baru wajib diisi.');

    var tasks = readTable_(TABLES.TASKS);
    var original = tasks.filter(function (t) { return t._row === rowIndex; })[0];
    if (!original) throw new Error('Task tidak ditemukan.');

    updateTableRow_(TABLES.TASKS, rowIndex, { status: 'Failed' });

    var newObj = {
      contactPerson: original.contactPerson,
      agen: original.agen,
      admin: original.admin,
      dueDate: newDueDate,
      priority: original.priority,
      status: 'Scheduled',
      poin: original.poin,
      kategori: original.kategori,
      daysUntilDue: daysBetween_(newDueDate)
    };
    var newRow = appendToTable_(TABLES.TASKS, newObj);
    return { _row: newRow };
  });
}


/* ============================== ActivityService ============================== */


/**
 * ===================================================================
 * ACTIVITYSERVICE.GS
 * ===================================================================
 */

function apiListActivity(token) {
  return safeCall_(function () {
    requireSession_(token);
    return readTable_(TABLES.ACTIVITY).sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  });
}

function apiSaveActivity(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.contactPerson || !payload.date) {
      throw new Error('Kontak Agen dan Tanggal wajib diisi.');
    }

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === payload.contactPerson; })[0];

    // clientStatus (Status Klien) sengaja tidak ditulis lagi - field ini
    // sudah dihapus dari form Activity Log. Nilai lama di sheet (kalau ada)
    // dibiarkan apa adanya saat edit.
    var obj = {
      contactPerson: payload.contactPerson,
      agen: agen ? agen.namaAgen : (payload.agen || ''),
      date: payload.date,
      admin: payload.admin || '',
      contactMethod: payload.contactMethod || '',
      notes: payload.notes || ''
    };

    if (payload._row) {
      updateTableRow_(TABLES.ACTIVITY, payload._row, obj);
      return { _row: payload._row };
    } else {
      var row = appendToTable_(TABLES.ACTIVITY, obj);
      return { _row: row };
    }
  });
}

function apiDeleteActivity(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.ACTIVITY, rowIndex);
    return true;
  });
}


/* ============================== PIService ============================== */


/**
 * ===================================================================
 * PISERVICE.GS
 * Status PI ("Belum SO" / "Sudah SO") dihitung OTOMATIS berdasarkan
 * apakah nomor PI ini sudah dipakai (linked) oleh sebuah Sales Order,
 * bukan dropdown manual lagi.
 * ===================================================================
 */

function apiListPI(token) {
  return safeCall_(function () {
    requireSession_(token);
    var linkedSet = computeSOLinkedSet_(readTable_(TABLES.SO));
    return readTable_(TABLES.PI)
      .map(function (p) {
        p.statusPI = computePIDisplayStatus_(p, linkedSet);
        return p;
      })
      .sort(function (a, b) { return new Date(b.piDate) - new Date(a.piDate); });
  });
}

function apiSavePI(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.contactPerson || !payload.dealValue || !payload.piDate) {
      throw new Error('Kontak Agen, Deal Value, dan PI Date wajib diisi.');
    }

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === payload.contactPerson; })[0];
    var isNew = !payload._row;
    var nomorPI = isNew ? generatePINumber_() : payload.nomorPI;

    // dealName, paymentDate, clientStatus, statusPI TIDAK ditulis lagi dari
    // form (field-field ini sudah dihapus dari form Proforma Invoice).
    // Kalau ada nilai lama di sheet, nilai itu dibiarkan apa adanya
    // (updateTableRow_ hanya menimpa kolom yang memang ada di object ini).
    var obj = {
      nomorPI: nomorPI,
      contactPerson: payload.contactPerson,
      agen: agen ? agen.namaAgen : (payload.agen || ''),
      salesRep: payload.salesRep || '', // label di UI: "Admin"
      dealValue: Number(payload.dealValue) || 0,
      piDate: payload.piDate,
      lastUpdated: todayStr_(),
      notes: payload.notes || ''
    };

    if (isNew) {
      var row = appendToTable_(TABLES.PI, obj);
      return { _row: row, nomorPI: nomorPI };
    } else {
      updateTableRow_(TABLES.PI, payload._row, obj);
      return { _row: payload._row, nomorPI: nomorPI };
    }
  });
}

function apiDeletePI(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.PI, rowIndex);
    return true;
  });
}


/* ============================== SOService ============================== */


/**
 * ===================================================================
 * SOSERVICE.GS
 * Aturan otomatis:
 *  - Payment Date diisi          -> Status otomatis jadi 'Paid'
 *  - Due Date sudah lewat        -> Status tampil 'Overdue' (merah)
 *  - Selain itu                  -> pakai Status manual yang dipilih
 *  - "Days Until Due" & "Notes" ditampilkan di list untuk follow-up
 * ===================================================================
 */

function apiListSO(token) {
  return safeCall_(function () {
    requireSession_(token);
    return readTable_(TABLES.SO)
      .map(function (s) {
        s.daysUntilDue = daysBetween_(s.dueDate);
        s.displayStatus = computeSODisplayStatus_(s);
        return s;
      })
      // Urut berdasarkan Due Date (paling mendesak duluan) sesuai kebutuhan follow-up
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
  });
}

function apiSaveSO(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.contactPerson || !payload.amount || !payload.dueDate) {
      throw new Error('Kontak Agen, Amount, dan Due Date wajib diisi.');
    }

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === payload.contactPerson; })[0];
    var isNew = !payload._row;
    var soNumber = isNew ? generateSONumber_() : payload.soNumber;

    // Kalau Payment Date diisi, status dipaksa jadi 'Paid' (aturan #9)
    var status = payload.status || 'Pending';
    if (payload.paymentDate) status = 'Paid';

    var obj = {
      soNumber: soNumber,
      contactPerson: payload.contactPerson,
      agen: agen ? agen.namaAgen : (payload.agen || ''),
      linkedPI: payload.linkedPI || '',
      // description (Invoice Description) sengaja tidak ditulis lagi dari
      // form - field ini sudah dihapus dari popup Tambah/Edit Sales Order.
      amount: Number(payload.amount) || 0,
      status: status,
      terms: payload.terms || '',
      soDate: payload.soDate || todayStr_(),
      dueDate: payload.dueDate,
      paymentDate: payload.paymentDate || '',
      notes: payload.notes || ''
      // clientStatus TIDAK ditulis lagi (diganti "Days Until Due" yang dihitung otomatis)
    };

    if (isNew) {
      var row = appendToTable_(TABLES.SO, obj);
      return { _row: row, soNumber: soNumber };
    } else {
      updateTableRow_(TABLES.SO, payload._row, obj);
      return { _row: payload._row, soNumber: soNumber };
    }
  });
}

function apiDeleteSO(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.SO, rowIndex);
    return true;
  });
}


/* ============================== GiftService ============================== */


/**
 * ===================================================================
 * GIFTSERVICE.GS
 * ===================================================================
 */

function apiListGifts(token) {
  return safeCall_(function () {
    requireSession_(token);
    return readTable_(TABLES.GIFTS).sort(function (a, b) {
      return new Date(b.deliveryDate) - new Date(a.deliveryDate);
    });
  });
}

function apiSaveGift(token, payload) {
  return safeCall_(function () {
    requireSession_(token);
    if (!payload.recipient || !payload.deliveryDate) {
      throw new Error('Penerima dan Tanggal Pengiriman wajib diisi.');
    }

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === payload.recipient; })[0];

    var obj = {
      recipient: payload.recipient,
      clientCompany: agen ? agen.namaAgen : (payload.clientCompany || ''),
      salesRep: payload.salesRep || '',
      description: payload.description || '',
      value: payload.value ? Number(payload.value) : '',
      deliveryDate: payload.deliveryDate,
      notes: payload.notes || ''
    };

    if (payload._row) {
      updateTableRow_(TABLES.GIFTS, payload._row, obj);
      return { _row: payload._row };
    } else {
      var row = appendToTable_(TABLES.GIFTS, obj);
      return { _row: row };
    }
  });
}

function apiDeleteGift(token, rowIndex) {
  return safeCall_(function () {
    requireSession_(token);
    deleteTableRow_(TABLES.GIFTS, rowIndex);
    return true;
  });
}


/* ============================== LookupService ============================== */


/**
 * ===================================================================
 * LOOKUPSERVICE.GS
 * Diberi "Kode Kontak" agen (format: [NEZ_0001] Nama), kembalikan
 * profil lengkap: Detail Kontak, Recent Activity, Recent PI,
 * Recent SO, dan Gifts.
 * ===================================================================
 */

function apiLookupAgen(token, kodeKontak) {
  return safeCall_(function () {
    requireSession_(token);
    if (!kodeKontak) throw new Error('Pilih agen terlebih dahulu.');

    var agen = readTable_(TABLES.AGEN).filter(function (a) { return a.kodeKontak === kodeKontak; })[0];
    if (!agen) throw new Error('Data agen tidak ditemukan.');

    var activity = readTable_(TABLES.ACTIVITY)
      .filter(function (a) { return a.contactPerson === kodeKontak; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
      .slice(0, 5);

    var soAll = readTable_(TABLES.SO);
    var linkedSet = computeSOLinkedSet_(soAll);

    // Status PI dihitung otomatis (Belum SO / Sudah SO), sama seperti tab Proforma Invoice.
    var pi = readTable_(TABLES.PI)
      .filter(function (p) { return p.contactPerson === kodeKontak; })
      .map(function (p) { p.statusPI = computePIDisplayStatus_(p, linkedSet); return p; })
      .sort(function (a, b) { return new Date(b.piDate) - new Date(a.piDate); })
      .slice(0, 5);

    // Status SO & Sisa Hari dihitung otomatis, sama seperti tab Sales Order.
    var so = soAll
      .filter(function (s) { return s.contactPerson === kodeKontak; })
      .map(function (s) { s.daysUntilDue = daysBetween_(s.dueDate); s.displayStatus = computeSODisplayStatus_(s); return s; })
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); })
      .slice(0, 5);

    var gifts = readTable_(TABLES.GIFTS)
      .filter(function (g) { return g.recipient === kodeKontak; })
      .sort(function (a, b) { return new Date(b.deliveryDate) - new Date(a.deliveryDate); })
      .slice(0, 5);

    return { agen: agen, activity: activity, pi: pi, so: so, gifts: gifts };
  });
}


/* ============================== DashboardService ============================== */


/**
 * ===================================================================
 * DASHBOARDSERVICE.GS
 * Menghitung ulang semua angka yang di Spreadsheet asli dibuat lewat
 * formula QUERY/COUNTIF di Sheet Setup & Dashboard.
 *
 * dateFrom / dateTo (opsional, format 'yyyy-MM-dd'): kalau diisi, semua
 * bagian yang berbasis tanggal (Top 5 PI/SO, Status SO, Task Status,
 * daftar Recent, PI Made) ikut difilter ke rentang itu. KPI "Activities
 * Last 7/30 Days" & "Total Agen" sengaja TETAP dari data penuh (bukan
 * metrik yang cocok difilter rentang tanggal custom).
 * ===================================================================
 */

function apiGetDashboard(token, dateFrom, dateTo) {
  return safeCall_(function () {
    requireSession_(token);

    var agenList = readTable_(TABLES.AGEN);
    var taskListAll = readTable_(TABLES.TASKS);
    var activityListAll = readTable_(TABLES.ACTIVITY);
    var piListAll = readTable_(TABLES.PI);
    var soListAll = readTable_(TABLES.SO);

    var today = new Date(todayStr_());
    var last7 = new Date(today); last7.setDate(last7.getDate() - 7);
    var last30 = new Date(today); last30.setDate(last30.getDate() - 30);

    var hasFilter = !!(dateFrom || dateTo);
    var rangeStart = dateFrom ? new Date(dateFrom) : null;
    var rangeEnd = dateTo ? new Date(dateTo) : null;
    function inRange_(dateStr) {
      if (!dateStr) return false;
      var d = new Date(dateStr);
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    }

    // Dataset yang dipakai untuk bagian2 yang mengikuti filter tanggal.
    var taskList = hasFilter ? taskListAll.filter(function (t) { return inRange_(t.dueDate); }) : taskListAll;
    var activityList = hasFilter ? activityListAll.filter(function (a) { return inRange_(a.date); }) : activityListAll;
    var piList = hasFilter ? piListAll.filter(function (p) { return inRange_(p.piDate); }) : piListAll;
    var soList = hasFilter ? soListAll.filter(function (s) { return inRange_(s.dueDate); }) : soListAll;

    // ---- KPI cards (Total Agen & Activities 7/30 hari selalu dari data penuh) ----
    var kpi = {
      totalAgen: agenList.length,
      activities7d: activityListAll.filter(function (a) { return a.date && new Date(a.date) >= last7 && new Date(a.date) <= today; }).length,
      activities30d: activityListAll.filter(function (a) { return a.date && new Date(a.date) >= last30 && new Date(a.date) <= today; }).length,
      piMade: piList.length
    };

    // ---- Top 5 Agen by jumlah transaksi PI & nominal PI ----
    var piByAgen = {};
    piList.forEach(function (p) {
      var key = p.agen || '(Tanpa Agen)';
      if (!piByAgen[key]) piByAgen[key] = { count: 0, total: 0 };
      piByAgen[key].count += 1;
      piByAgen[key].total += Number(p.dealValue) || 0;
    });
    var top5ByCount = toSortedArray_(piByAgen, 'count').slice(0, 5);
    var top5ByNominal = toSortedArray_(piByAgen, 'total').slice(0, 5);

    // ---- Active Agent Status (tidak berbasis tanggal, selalu data penuh) ----
    var statusCount = {};
    agenList.forEach(function (a) {
      var s = a.status || '(Kosong)';
      statusCount[s] = (statusCount[s] || 0) + 1;
    });

    // ---- Top 5 Sales Order by nominal ----
    var soByAgen = {};
    soList.forEach(function (s) {
      var key = s.agen || '(Tanpa Agen)';
      soByAgen[key] = (soByAgen[key] || 0) + (Number(s.amount) || 0);
    });
    var top5SO = Object.keys(soByAgen)
      .map(function (k) { return { label: k, value: soByAgen[k] }; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 5);

    // ---- Status SO (pakai status otomatis: Paid/Overdue/manual) ----
    var linkedSetFull = computeSOLinkedSet_(soListAll); // status PI/SO tetap dihitung dari data PENUH, biar konsisten dgn tab aslinya
    var statusSOCount = {};
    soList.forEach(function (s) {
      var st = computeSODisplayStatus_(s);
      statusSOCount[st] = (statusSOCount[st] || 0) + 1;
    });

    // ---- Task status: Scheduled vs Completed (Done*) vs Failed ----
    var scheduled = taskList.filter(function (t) { return t.status === 'Scheduled'; }).length;
    var completed = taskList.filter(function (t) { return /^Done/i.test(t.status || ''); }).length;
    var failed = taskList.filter(function (t) { return t.status === 'Failed'; }).length;

    // ---- Recent lists ----
    var recentActivity = activityList
      .slice()
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
      .slice(0, 10);

    var upcomingTasks = taskList
      .filter(function (t) { return t.status === 'Scheduled'; })
      .map(function (t) { t.daysUntilDue = daysBetween_(t.dueDate); return t; })
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); })
      .slice(0, 5);

    var recentPI = piList
      .slice()
      .sort(function (a, b) { return new Date(b.piDate) - new Date(a.piDate); })
      .slice(0, 5)
      .map(function (p) { p.statusPI = computePIDisplayStatus_(p, linkedSetFull); return p; });

    // Recent SO diurutkan & ditampilkan berdasarkan Due Date (bukan SO Date)
    // supaya yang paling mendesak untuk di-follow-up muncul duluan.
    var recentSO = soList
      .slice()
      .sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); })
      .slice(0, 5)
      .map(function (s) { s.daysUntilDue = daysBetween_(s.dueDate); s.displayStatus = computeSODisplayStatus_(s); return s; });

    // ---- Target / Realisasi / % Pencapaian Kontak ----
    // "Kontak" = jumlah Activity yang tercatat. Kalau ada filter tanggal
    // custom, realisasi mengikuti rentang itu; kalau tidak, defaultnya
    // bulan berjalan (1 s.d. hari ini).
    var kontakRangeActivities;
    if (hasFilter) {
      kontakRangeActivities = activityList; // sudah difilter di atas
    } else {
      var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      kontakRangeActivities = activityListAll.filter(function (a) {
        if (!a.date) return false;
        var d = new Date(a.date);
        return d >= firstOfMonth && d <= today;
      });
    }
    var targetKontak = Number(getSetupList_('targetKontak', false)[0]) || 0;
    var realisasiKontak = kontakRangeActivities.length;
    var pencapaianKontak = targetKontak > 0 ? Math.round((realisasiKontak / targetKontak) * 100) : null;

    return {
      companyName: getSetupList_('companyName', false)[0] || 'Nez Scent',
      hasFilter: hasFilter,
      kpi: kpi,
      top5ByCount: top5ByCount,
      top5ByNominal: top5ByNominal,
      statusAgen: objToArray_(statusCount),
      top5SO: top5SO,
      statusSO: objToArray_(statusSOCount),
      taskStatus: { scheduled: scheduled, completed: completed, failed: failed },
      recentActivity: recentActivity,
      upcomingTasks: upcomingTasks,
      recentPI: recentPI,
      recentSO: recentSO,
      kontak: { target: targetKontak, realisasi: realisasiKontak, pencapaian: pencapaianKontak }
    };
  });
}

function toSortedArray_(map, sortField) {
  return Object.keys(map)
    .map(function (k) { return { label: k, count: map[k].count, value: sortField === 'total' ? map[k].total : map[k].count }; })
    .sort(function (a, b) { return (sortField === 'total' ? b.value - a.value : b.value - a.value); });
}

function objToArray_(map) {
  return Object.keys(map).map(function (k) { return { label: k, value: map[k] }; });
}


/* ============================== Installer ============================== */


/**
 * ===================================================================
 * INSTALLER.GS
 * Jalankan sekali di awal (dari editor Apps Script) untuk menyiapkan
 * struktur tambahan yang dibutuhkan web app ini:
 *   1. Sheet "Users" + akun awal (manager / zahra)
 *   2. Kolom baru: Tasks!K "KATEGORI", PI!M "STATUS PI"
 *      (dua kolom ini belum ada di spreadsheet asli; ditambahkan agar
 *      Task Categories & Status Transaksi di Setup benar-benar terpakai)
 *   3. Custom menu "Nez Scent App" di Spreadsheet UI
 * ===================================================================
 */

function runInitialSetup() {
  setupInitialUsers();
  ensureExtraColumns_();
  SpreadsheetApp.getUi().alert('Setup selesai! Sheet Users siap, kolom tambahan sudah dibuat.\nSekarang deploy sebagai Web App (Deploy > New deployment > Web app).');
}

function ensureExtraColumns_() {
  var db = getDB_();

  var tasksSheet = db.getSheetByName(SHEETS.TASKS);
  if (tasksSheet && !tasksSheet.getRange(5, 11).getValue()) {
    tasksSheet.getRange(5, 11).setValue('KATEGORI');
  }

  var piSheet = db.getSheetByName(SHEETS.PI);
  if (piSheet && !piSheet.getRange(5, 13).getValue()) {
    piSheet.getRange(5, 13).setValue('STATUS PI');
  }

  // Target Kontak per Bulan (dipakai KPI "% Pencapaian Kontak" di Dashboard)
  var setupSheet = db.getSheetByName(SHEETS.SETUP);
  if (setupSheet && !setupSheet.getRange(5, 46).getValue()) {
    setupSheet.getRange(5, 46).setValue('TARGET KONTAK / BULAN');
    setupSheet.getRange(6, 46).setValue(50); // nilai default, bisa diubah lewat menu Setup
  }
}

/** Menambahkan menu custom saat spreadsheet dibuka (opsional, memudahkan admin). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Nez Scent App')
    .addItem('1) Jalankan Setup Awal', 'runInitialSetup')
    .addItem('2) Rapikan Baris Nyasar (percepat loading)', 'cleanupOrphanRows')
    .addToUi();
}

/**
 * PERBAIKAN SEKALI JALAN: sebelum fix ini ada, baris baru yang ditambah
 * lewat web app bisa "nyasar" jauh di bawah (misal baris ke-12.000-an)
 * karena salah baca baris kosong berformat sisa template lama. Fungsi
 * ini memadatkan ulang setiap tabel: baris yang ada isinya dikumpulkan
 * lalu ditulis ulang rapat dari baris data pertama, sisanya dikosongkan.
 * Aman dijalankan berkali-kali. Jalankan SEKALI setelah update Code.gs
 * ini untuk langsung merasakan loading yang jauh lebih cepat.
 */
function cleanupOrphanRows() {
  var defs = [TABLES.AGEN, TABLES.TASKS, TABLES.ACTIVITY, TABLES.PI, TABLES.SO, TABLES.GIFTS];
  var report = [];

  defs.forEach(function (tableDef) {
    var sheet = getDB_().getSheetByName(tableDef.sheet);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < tableDef.dataStart) { report.push(tableDef.sheet + ': kosong, dilewati.'); return; }

    var numRows = lastRow - tableDef.dataStart + 1;
    var range = sheet.getRange(tableDef.dataStart, 1, numRows, tableDef.lastCol);
    var values = range.getValues();

    var fields = Object.keys(tableDef.cols);
    var firstColIdx = tableDef.cols[fields[0]] - 1;
    var realRows = values.filter(function (row) { return row[firstColIdx] !== '' && row[firstColIdx] !== null; });

    range.clearContent(); // kosongkan seluruh rentang lama (termasuk baris nyasar di bawah)
    if (realRows.length) {
      sheet.getRange(tableDef.dataStart, 1, realRows.length, tableDef.lastCol).setValues(realRows);
    }
    report.push(tableDef.sheet + ': ' + realRows.length + ' baris asli dipadatkan (dari rentang ' + numRows + ' baris menjadi ' + realRows.length + ').');
  });

  SpreadsheetApp.getUi().alert('Cleanup selesai!\n\n' + report.join('\n'));
}


/* ============================== Code ============================== */


/**
 * ===================================================================
 * CODE.GS — API BACKEND (bukan lagi server tampilan)
 * Frontend (HTML/CSS/JS) sekarang berdiri sendiri, di-hosting di
 * Netlify/GitHub Pages, dan memanggil Web App ini lewat fetch() POST.
 * Spreadsheet tetap jadi database, Apps Script cuma jadi jembatan API.
 * ===================================================================
 */

/**
 * Whitelist fungsi yang boleh dipanggil dari luar lewat doPost.
 * Ini penting untuk keamanan — jangan ganti jadi "panggil fungsi apa saja
 * berdasarkan nama string" tanpa whitelist, supaya orang luar tidak bisa
 * memanggil fungsi internal (yang diawali garis bawah `_`) secara langsung.
 */
var API_FUNCTIONS = {
  // Auth
  apiLogin: apiLogin,
  apiLogout: apiLogout,
  apiValidateSession: apiValidateSession,

  // Setup / form options
  apiGetFormOptions: apiGetFormOptions,
  apiGetSetupLists: apiGetSetupLists,
  apiSaveSetupList: apiSaveSetupList,
  apiSaveCompanyName: apiSaveCompanyName,
  apiSaveTargetKontak: apiSaveTargetKontak,

  // Users
  apiListUsers: apiListUsers,
  apiSaveUser: apiSaveUser,
  apiDeleteUser: apiDeleteUser,

  // Agen
  apiListAgen: apiListAgen,
  apiSaveAgen: apiSaveAgen,
  apiDeleteAgen: apiDeleteAgen,

  // Tasks
  apiListTasks: apiListTasks,
  apiSaveTask: apiSaveTask,
  apiDeleteTask: apiDeleteTask,
  apiRecreateTask: apiRecreateTask,

  // Activity
  apiListActivity: apiListActivity,
  apiSaveActivity: apiSaveActivity,
  apiDeleteActivity: apiDeleteActivity,

  // PI
  apiListPI: apiListPI,
  apiSavePI: apiSavePI,
  apiDeletePI: apiDeletePI,

  // SO
  apiListSO: apiListSO,
  apiSaveSO: apiSaveSO,
  apiDeleteSO: apiDeleteSO,

  // Gifts
  apiListGifts: apiListGifts,
  apiSaveGift: apiSaveGift,
  apiDeleteGift: apiDeleteGift,

  // Lookup
  apiLookupAgen: apiLookupAgen,

  // Dashboard
  apiGetDashboard: apiGetDashboard
};

/**
 * Semua request dari frontend masuk lewat sini (POST), format body:
 *   { "fn": "apiLogin", "args": ["manager", "manager123"] }
 * Frontend WAJIB kirim dengan header Content-Type: text/plain
 * (bukan application/json) supaya browser tidak melakukan CORS
 * preflight (Apps Script tidak mendukung method OPTIONS) — isi body
 * tetap JSON string biasa, cuma header-nya yang disamarkan.
 */
function doPost(e) {
  var result;
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var fnName = body.fn;
    var args = body.args || [];

    var fn = API_FUNCTIONS[fnName];
    if (typeof fn !== 'function') {
      throw new Error('Endpoint tidak dikenal: ' + fnName);
    }
    result = fn.apply(null, args);
  } catch (err) {
    result = { ok: false, error: err.message };
  }
  return jsonOutput_(result);
}

/** doGet cuma dipakai untuk healthcheck / cek Web App sudah aktif. */
function doGet(e) {
  return jsonOutput_({
    ok: true,
    message: 'Nez Scent API aktif. Gunakan POST dengan body {"fn":"...","args":[...]} untuk memanggil endpoint.'
  });
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
