// =========================================================================
// 1. INISIALISASI STATE & CACHE (BUSINESS LOGIC)
// =========================================================================
var STATE = { 
  page: 'dashboard', 
  token: 'YOUR_AUTH_TOKEN_HERE' 
};

// Cache objek untuk menyimpan data agar transisi antar menu instan
var CRUD_CACHE = {}; 

var PAGE_TITLES = { 
  dashboard: 'Dashboard Utama', 
  agen: 'Manajemen Data Agen', 
  tasks: 'Daftar Tasks Pekerjaan' 
};

// =========================================================================
// 2. FUNGSI NAVIGASI (FLOW KURSOR KLIK MENU)
// =========================================================================
function navigate(page) {
  STATE.page = page;
  
  // Update Judul Halaman
  var titleElement = document.getElementById('pageTitle');
  if (titleElement) {
    titleElement.textContent = PAGE_TITLES[page] || page;
  }
  
  // Update Visual State Aktif di Menu
  document.querySelectorAll('.nav-link').forEach(function (element) {
    if (element.getAttribute('data-page') === page) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
  
  // Konfigurasi Entity untuk masing-masing halaman
  var renderers = {
    'agen': function() { 
      renderCrudPage({ key: 'agen', listFn: 'getAgen' }); 
    },
    'tasks': function() { 
      renderCrudPage({ key: 'tasks', listFn: 'getTasks' }); 
    },
    'dashboard': renderDashboard
  };
  
  // Jalankan render sesuai halaman (Dashboard sebagai default)
  (renderers[page] || renderDashboard)();
}

// =========================================================================
// 3. FUNGSI RENDER DATA (FLOW STALE-WHILE-REVALIDATE / OPTIMISTIC UI)
// =========================================================================
function renderCrudPage(entity) {
  var content = document.getElementById('content');

  // STEP A: Tembak data dari CACHE ke UI seketika (tanpa loading)
  if (CRUD_CACHE[entity.key]) {
    paintCrudPage(entity, CRUD_CACHE[entity.key], getSearchValue());
  } else {
    // Tampilkan loading HANYA JIKA data belum pernah diload sama sekali
    content.innerHTML = '<div class="loading-spin"></div>';
  }

  // STEP B: Tembak API Server di background secara asinkron
  api(entity.listFn, STATE.token).then(function (rows) {
    var isFirstLoad = !CRUD_CACHE[entity.key];
    
    // Cek komparasi apakah data dari server berbeda dengan data di cache
    var isDataChanged = JSON.stringify(CRUD_CACHE[entity.key]) !== JSON.stringify(rows);
    
    // Simpan data terbaru ke Cache
    CRUD_CACHE[entity.key] = rows;

    // STEP C: Timpa UI / Re-render HANYA JIKA datanya memang ada perubahan
    if (isFirstLoad || isDataChanged) {
      paintCrudPage(entity, rows, getSearchValue());
    }
  }).catch(function (err) { 
    toast(err.message || 'Terjadi kesalahan sistem', 'error'); 
  });
}

// =========================================================================
// 4. FIX BUG: FLOW TRANSISI BACKGROUND BERDASARKAN THUMBNAIL
// =========================================================================
function initThumbnailHoverFlow() {
  var thumbnails = document.querySelectorAll('.menu-thumbnail');
  var appBackground = document.getElementById('app-background');

  if (!appBackground) return;

  thumbnails.forEach(function(thumb) {
    // Event mouseenter: Trigger saat kursor menyentuh/pindah ke area thumbnail
    thumb.addEventListener('mouseenter', function(e) {
      // Ambil URL gambar spesifik dari data attribute HTML
      var bgUrl = e.currentTarget.getAttribute('data-bg-url');
      
      // Tembakkan langsung ke layer background
      if (bgUrl) {
        appBackground.style.backgroundImage = 'url(' + bgUrl + ')';
      }
    });
  });
}

// =========================================================================
// 5. HELPER & FUNGSI BAWAAN APLIKASI
// =========================================================================

// Fungsi untuk mendapatkan nilai pencarian saat ini
function getSearchValue() {
  var searchInput = document.getElementById('crudSearch');
  return searchInput ? searchInput.value.toLowerCase() : '';
}

// Fungsi dummy untuk merender Dashboard UI
function renderDashboard() {
  var content = document.getElementById('content');
  content.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3>Selamat datang di Sistem Dashboard</h3>
      <p>Pilih menu di sebelah kiri untuk mengelola data operasional.</p>
    </div>
  `;
}

// Fungsi dummy untuk menggambar tabel CRUD di layar
function paintCrudPage(entity, rows, searchQuery) {
  var content = document.getElementById('content');
  
  // Filter data sederhana berdasarkan input search
  var filteredRows = rows;
  if (searchQuery) {
    filteredRows = rows.filter(function(row) {
      return Object.values(row).join(' ').toLowerCase().includes(searchQuery);
    });
  }

  // Buat UI Tabel
  var html = '<table class="data-table"><thead><tr>';
  
  if (filteredRows.length > 0) {
    // Generate Header otomatis
    Object.keys(filteredRows[0]).forEach(function(key) {
      html += '<th>' + key.toUpperCase() + '</th>';
    });
    html += '</tr></thead><tbody>';
    
    // Generate Rows otomatis
    filteredRows.forEach(function(row) {
      html += '<tr>';
      Object.values(row).forEach(function(val) {
        html += '<td>' + val + '</td>';
      });
      html += '</tr>';
    });
  } else {
    html += '<th>Data</th></tr></thead><tbody><tr><td>Tidak ada data ditemukan.</td></tr>';
  }
  
  html += '</tbody></table>';
  content.innerHTML = html;
}

// Fungsi event handler untuk typing di search bar
window.handleSearch = function() {
  // Hanya trigger search ulang jika bukan di halaman dashboard
  if (STATE.page !== 'dashboard') {
    var entityMap = {
      'agen': { key: 'agen', listFn: 'getAgen' },
      'tasks': { key: 'tasks', listFn: 'getTasks' }
    };
    var currentEntity = entityMap[STATE.page];
    if (currentEntity && CRUD_CACHE[currentEntity.key]) {
      // Re-render UI secara lokal langsung dari cache
      paintCrudPage(currentEntity, CRUD_CACHE[currentEntity.key], getSearchValue());
    }
  }
};

// Fungsi dummy untuk mensimulasikan pemanggilan API (Google Apps Script fetch)
function api(endpoint, token) {
  return new Promise(function(resolve, reject) {
    // Simulasi Network Latency / Respon Server yang butuh waktu (misal 1 detik)
    setTimeout(function() {
      if (endpoint === 'getAgen') {
        resolve([
          { id: 'AG-001', nama: 'Budi Santoso', status: 'Aktif' },
          { id: 'AG-002', nama: 'Siti Aminah', status: 'Pending' }
        ]);
      } else if (endpoint === 'getTasks') {
        resolve([
          { task_id: 'TSK-100', deskripsi: 'Maintenance Server', prioritas: 'High' },
          { task_id: 'TSK-101', deskripsi: 'Update Modul Invoice', prioritas: 'Medium' }
        ]);
      } else {
        reject(new Error('Endpoint tidak ditemukan.'));
      }
    }, 1000); 
  });
}

// Fungsi dummy untuk menampilkan notifikasi Error/Success
function toast(message, type) {
  console.log('[' + type.toUpperCase() + '] ' + message);
  alert(message);
}

// =========================================================================
// 6. INITIALIZATION POINT (JALANKAN SAAT WEB PERTAMA DIBUKA)
// =========================================================================
document.addEventListener('DOMContentLoaded', function() {
  // 1. Jalankan inisialisasi transisi visual
  initThumbnailHoverFlow();
  
  // 2. Load halaman pertama (Dashboard)
  navigate('dashboard');
});
