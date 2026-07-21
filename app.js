// 1. STATE & CACHE INITIALIZATION
var STATE = { page: 'dashboard', token: 'YOUR_TOKEN' };
var CRUD_CACHE = {};
var PAGE_TITLES = { dashboard: 'Dashboard', agen: 'Agen', tasks: 'Tasks' };

// 2. FUNGSI NAVIGASI HALAMAN (Tanpa Blocking Spinner)
function navigate(page) {
  STATE.page = page;
  var titleElement = document.getElementById('pageTitle');
  if (titleElement) titleElement.textContent = PAGE_TITLES[page] || page;
  
  // Update state aktif pada menu
  document.querySelectorAll('.nav-link').forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('data-page') === page);
  });
  
  // Routing Flow
  var renderers = {
    'agen': function() { renderCrudPage({ key: 'agen', listFn: 'getAgen' }); },
    'tasks': function() { renderCrudPage({ key: 'tasks', listFn: 'getTasks' }); },
    'dashboard': renderDashboard
  };
  
  (renderers[page] || renderDashboard)();
}

// 3. FUNGSI RENDER DATA (Optimistic UI - Stale-While-Revalidate Flow)
function renderCrudPage(entity) {
  var content = document.getElementById('content');

  // Cek cache: Render seketika jika data sudah pernah ditarik
  if (CRUD_CACHE[entity.key]) {
    paintCrudPage(entity, CRUD_CACHE[entity.key], '');
  } else {
    // Tampilkan spinner hanya pada load pertama yang benar-benar kosong
    content.innerHTML = '<div class="loading-spin"></div>';
  }

  // Background sync API
  api(entity.listFn, STATE.token).then(function (rows) {
    var isFirstLoad = !CRUD_CACHE[entity.key];
    var isDataChanged = JSON.stringify(CRUD_CACHE[entity.key]) !== JSON.stringify(rows);
    
    CRUD_CACHE[entity.key] = rows;

    if (isFirstLoad || isDataChanged) {
      var searchInput = document.getElementById('crudSearch');
      var currentSearch = searchInput ? searchInput.value : '';
      paintCrudPage(entity, rows, currentSearch);
    }
  }).catch(function (err) { 
    toast(err.message, 'error'); 
  });
}

// 4. FIX BUG: FLOW TRANSISI BACKGROUND THUMBNAIL
function initThumbnailHoverFlow() {
  var thumbnails = document.querySelectorAll('.menu-thumbnail');
  var appBackground = document.getElementById('app-background');

  if (!appBackground) return;

  thumbnails.forEach(function(thumb) {
    // Menggunakan mouseenter agar trigger aktif saat kursor masuk ke area elemen
    thumb.addEventListener('mouseenter', function(e) {
      // Ambil referensi URL background dari data-attribute masing-masing thumbnail
      var bgUrl = e.currentTarget.getAttribute('data-bg-url');
      
      if (bgUrl) {
        // Terapkan perubahan pada elemen layer background khusus
        appBackground.style.backgroundImage = 'url(' + bgUrl + ')';
      }
    });
  });
}

// Eksekusi flow visual saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  initThumbnailHoverFlow();
});
