// =============================================
// FUE ZARIA MATRICULATION GALLERY — app.js
// =============================================

// ---- STATE ----
let photos = JSON.parse(localStorage.getItem('fue_photos')) || generateDemoPhotos();
let visitors = JSON.parse(localStorage.getItem('fue_visitors')) || [];
let downloads = JSON.parse(localStorage.getItem('fue_downloads')) || [];
let siteSettings = JSON.parse(localStorage.getItem('fue_settings')) || {
  title: 'FUE Zaria Matriculation Gallery',
  heroMsg: 'Browse, download, like, and share your memorable matriculation photos.',
  footerCredit: 'Built by the Department of Computer Science — Mbello'
};
let isAdmin = false;
let currentPhoto = null;
let pendingFiles = [];

// ---- DEMO PHOTOS ----
function generateDemoPhotos() {
  const names = [
    'Amina Bello', 'Usman Garba', 'Fatima Suleiman', 'Ibrahim Yusuf',
    'Hafsat Musa', 'Musa Abdullahi', 'Zainab Hassan', 'Abubakar Lawal',
    'Khadijah Umar', 'Yahaya Danladi', 'Rahinatu Aliyu', 'Sani Isah'
  ];
  const colors = [
    'linear-gradient(135deg,#006633,#00994d)',
    'linear-gradient(135deg,#004d26,#006633)',
    'linear-gradient(135deg,#008040,#004d26)',
    'linear-gradient(135deg,#00b359,#006633)',
    'linear-gradient(135deg,#003d1f,#006633)',
    'linear-gradient(135deg,#007a40,#00994d)',
  ];
  const emojis = ['🎓','👨‍🎓','👩‍🎓','🏛️','📸','🌟'];
  return names.map((name, i) => ({
    id: 'demo_' + i,
    name,
    dept: 'Computer Science',
    bg: colors[i % colors.length],
    emoji: emojis[i % emojis.length],
    likes: Math.floor(Math.random() * 40),
    downloads: Math.floor(Math.random() * 20),
    comments: [],
    likedBy: [],
    createdAt: Date.now() - i * 3600000,
    isDemo: true
  }));
}

function savePhotos() { localStorage.setItem('fue_photos', JSON.stringify(photos)); }
function saveVisitors() { localStorage.setItem('fue_visitors', JSON.stringify(visitors)); }
function saveDownloads() { localStorage.setItem('fue_downloads', JSON.stringify(downloads)); }
function saveSettings() {
  siteSettings.title = document.getElementById('siteTitle').value;
  siteSettings.heroMsg = document.getElementById('heroMsg').value;
  siteSettings.footerCredit = document.getElementById('footerCredit').value;
  localStorage.setItem('fue_settings', JSON.stringify(siteSettings));
  document.getElementById('footerCreditText').textContent = siteSettings.footerCredit;
  showToast('Settings saved!');
}

// ---- VISIT LOG ----
function logVisit(action) {
  const entry = { time: new Date().toLocaleString(), page: 'Gallery', action };
  visitors.unshift(entry);
  if (visitors.length > 100) visitors.pop();
  saveVisitors();
}
logVisit('Visited site');

// ---- GALLERY RENDER ----
function renderGallery(data) {
  const grid = document.getElementById('galleryGrid');
  if (!data.length) {
    grid.innerHTML = '<p style="text-align:center;color:#6b7280;padding:60px;grid-column:1/-1">No photos found.</p>';
    return;
  }
  grid.innerHTML = data.map(p => `
    <div class="photo-card" onclick="openLightbox('${p.id}')">
      <div class="photo-card-img" style="background:${p.bg || '#006633'}">
        ${p.src ? `<img src="${p.src}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:64px">${p.emoji || '🎓'}</span>`}
      </div>
      <div class="photo-card-body">
        <div class="photo-card-name">${p.name}</div>
        <div class="photo-card-dept">${p.dept} • FUE Zaria 2024</div>
        <div class="photo-card-actions">
          <button class="action-btn ${p.likedBy.includes('user') ? 'liked' : ''}" onclick="event.stopPropagation(); likePhoto('${p.id}')">
            ❤️ ${p.likes}
          </button>
          <button class="action-btn" onclick="event.stopPropagation(); downloadPhoto('${p.id}')">⬇️ ${p.downloads}</button>
          <button class="action-btn" onclick="event.stopPropagation(); sharePhoto('${p.id}')">🔗</button>
          ${isAdmin ? `<button class="action-btn" style="border-color:#dc2626;color:#dc2626" onclick="event.stopPropagation(); deletePhoto('${p.id}')">🗑️</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Stats
  document.getElementById('stat-photos').textContent = photos.length;
  document.getElementById('stat-downloads').textContent = photos.reduce((a, p) => a + p.downloads, 0);
}

function filterGallery() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;
  let data = photos.filter(p => p.name.toLowerCase().includes(q));
  if (sort === 'popular') data.sort((a, b) => b.likes - a.likes);
  else if (sort === 'downloads') data.sort((a, b) => b.downloads - a.downloads);
  else data.sort((a, b) => b.createdAt - a.createdAt);
  renderGallery(data);
}

function filterDept(dept) { filterGallery(); }

function showComingSoon() { showToast('This department will be added soon!'); }

// ---- LIGHTBOX ----
function openLightbox(id) {
  currentPhoto = id;
  const p = photos.find(x => x.id === id);
  if (!p) return;
  logVisit(`Viewed photo: ${p.name}`);

  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lbImage');
  if (p.src) { img.src = p.src; img.style.display = 'block'; }
  else {
    img.style.display = 'none';
    // Show emoji placeholder
    let ph = lb.querySelector('.lb-emoji-ph');
    if (!ph) { ph = document.createElement('div'); ph.className = 'lb-emoji-ph'; ph.style = 'text-align:center;font-size:100px;padding:30px;'; lb.querySelector('.lightbox-inner').insertBefore(ph, img.nextSibling); }
    ph.textContent = p.emoji || '🎓';
    ph.style.background = p.bg || '#006633';
    ph.style.borderRadius = '12px';
    ph.style.marginBottom = '16px';
  }
  document.getElementById('lbName').textContent = p.name;
  document.getElementById('lbLikes').textContent = p.likes;
  const lbBtn = document.getElementById('lbLikeBtn');
  lbBtn.className = 'lb-btn like-btn' + (p.likedBy.includes('user') ? ' liked' : '');
  renderComments(p);
  lb.classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  currentPhoto = null;
  // remove emoji placeholder
  document.querySelectorAll('.lb-emoji-ph').forEach(e => e.remove());
}

function renderComments(p) {
  const list = document.getElementById('lbComments');
  if (!p.comments.length) { list.innerHTML = '<p style="font-size:13px;color:#9ca3af">No comments yet. Be the first!</p>'; return; }
  list.innerHTML = p.comments.map(c => `
    <div class="comment">
      <div class="comment-author">${c.name}</div>
      <div class="comment-text">${c.text}</div>
      <div class="comment-time">${c.time}</div>
    </div>
  `).join('');
}

function addComment() {
  const name = document.getElementById('commentName').value.trim() || 'Anonymous';
  const text = document.getElementById('commentText').value.trim();
  if (!text) return;
  const p = photos.find(x => x.id === currentPhoto);
  if (!p) return;
  p.comments.push({ name, text, time: new Date().toLocaleString() });
  savePhotos();
  renderComments(p);
  document.getElementById('commentText').value = '';
  showToast('Comment posted!');
  logVisit(`Commented on: ${p.name}`);
}

// ---- ACTIONS ----
function likePhoto(id) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  if (p.likedBy.includes('user')) {
    p.likes--;
    p.likedBy = p.likedBy.filter(x => x !== 'user');
    showToast('Like removed');
  } else {
    p.likes++;
    p.likedBy.push('user');
    showToast('Liked! ❤️');
    logVisit(`Liked photo: ${p.name}`);
  }
  savePhotos();
  filterGallery();
  if (currentPhoto === id) {
    document.getElementById('lbLikes').textContent = p.likes;
    document.getElementById('lbLikeBtn').className = 'lb-btn like-btn' + (p.likedBy.includes('user') ? ' liked' : '');
  }
}

function downloadPhoto(id) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  p.downloads++;
  // Track download
  const dl = downloads.find(d => d.id === id);
  if (dl) dl.count++;
  else downloads.unshift({ id, name: p.name, count: 1, time: new Date().toLocaleString() });
  savePhotos(); saveDownloads();
  logVisit(`Downloaded photo: ${p.name}`);
  filterGallery();
  showToast('Download started! ⬇️');

  if (p.src) {
    const a = document.createElement('a');
    a.href = p.src;
    a.download = p.name + '.jpg';
    a.click();
  } else {
    // Generate canvas placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#006633';
    ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, 200, 260);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Computer Science • FUE Zaria 2024', 200, 290);
    ctx.font = '80px serif';
    ctx.fillText('🎓', 160, 200);
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = p.name + '.png';
      a.click();
    });
  }
}

function sharePhoto(id) {
  const p = photos.find(x => x.id === id);
  const url = window.location.href + '?photo=' + id;
  if (navigator.share) {
    navigator.share({ title: p.name + ' — FUE Zaria Matriculation', url });
  } else {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard! 🔗');
  }
  logVisit(`Shared photo: ${p.name}`);
}

function deletePhoto(id) {
  if (!isAdmin) return;
  if (!confirm('Delete this photo?')) return;
  photos = photos.filter(p => p.id !== id);
  savePhotos();
  filterGallery();
  loadAdminGallery();
  showToast('Photo deleted');
}

// ---- ADMIN ----
function openAdmin() { document.getElementById('adminOverlay').classList.remove('hidden'); }
function closeAdmin() { document.getElementById('adminOverlay').classList.add('hidden'); }

function doLogin() {
  const u = document.getElementById('adminUser').value;
  const pw = document.getElementById('adminPass').value;
  if (u === 'admin' && pw === 'fue2024') {
    isAdmin = true;
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminDash').classList.remove('hidden');
    filterGallery();
    loadAdminGallery();
    showToast('Welcome, Admin! 👋');
  } else {
    showToast('Incorrect credentials');
  }
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  event.target.classList.add('active');

  if (tab === 'visitors') {
    const tbody = document.getElementById('visitorsTable');
    tbody.innerHTML = visitors.map(v => `<tr><td>${v.time}</td><td>${v.page}</td><td>${v.action}</td></tr>`).join('') || '<tr><td colspan="3">No visitors yet</td></tr>';
  }
  if (tab === 'downloads') {
    const tbody = document.getElementById('downloadsTable');
    tbody.innerHTML = downloads.map(d => `<tr><td>${d.time}</td><td>${d.name}</td><td>${d.count}</td></tr>`).join('') || '<tr><td colspan="3">No downloads yet</td></tr>';
  }
  if (tab === 'settings') {
    document.getElementById('siteTitle').value = siteSettings.title;
    document.getElementById('heroMsg').value = siteSettings.heroMsg;
    document.getElementById('footerCredit').value = siteSettings.footerCredit;
    loadAdminGallery();
  }
}

function loadAdminGallery() {
  const list = document.getElementById('adminGalleryList');
  if (!list) return;
  list.innerHTML = photos.map(p => `
    <div class="admin-photo-row">
      <div style="width:50px;height:50px;border-radius:8px;background:${p.bg || '#006633'};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">
        ${p.src ? `<img src="${p.src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : p.emoji || '🎓'}
      </div>
      <div class="aph-info">
        <div class="aph-name">${p.name}</div>
        <div class="aph-stats">❤️ ${p.likes} &nbsp;⬇️ ${p.downloads} &nbsp;💬 ${p.comments.length}</div>
      </div>
      <button class="delete-btn" onclick="deletePhoto('${p.id}')">Delete</button>
    </div>
  `).join('') || '<p style="color:#6b7280;font-size:14px">No photos yet.</p>';
}

// ---- FILE UPLOAD ----
function handleFiles(event) {
  const files = Array.from(event.target.files);
  pendingFiles = files;
  const preview = document.getElementById('uploadPreview');
  preview.innerHTML = '';
  files.forEach(f => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(f);
  });
}

function handleDrop(event) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  pendingFiles = files;
  const fakeEvent = { target: { files } };
  handleFiles(fakeEvent);
}

function uploadPhoto() {
  const name = document.getElementById('uploadName').value.trim();
  if (!name) { showToast('Please enter a student name'); return; }
  if (!pendingFiles.length) { showToast('Please select at least one photo'); return; }
  pendingFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const photo = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        name,
        dept: 'Computer Science',
        src: e.target.result,
        bg: 'linear-gradient(135deg,#006633,#00994d)',
        emoji: '🎓',
        likes: 0, downloads: 0, comments: [], likedBy: [],
        createdAt: Date.now()
      };
      photos.unshift(photo);
      savePhotos();
      filterGallery();
      showToast('Photo uploaded successfully! 🎉');
      document.getElementById('uploadName').value = '';
      document.getElementById('uploadTag').value = '';
      document.getElementById('uploadPreview').innerHTML = '';
      pendingFiles = [];
      logVisit(`Admin uploaded photo: ${name}`);
    };
    reader.readAsDataURL(file);
  });
}

// ---- TOAST ----
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

// ---- MOBILE MENU ----
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '64px';
  links.style.left = '0'; links.style.right = '0';
  links.style.background = 'var(--green-dark)';
  links.style.padding = '20px';
  links.style.gap = '16px';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  filterGallery();
  document.getElementById('footerCreditText').textContent = siteSettings.footerCredit;
  document.getElementById('stat-views').textContent = (visitors.length + 1200).toLocaleString();

  // Close overlays on bg click
  document.getElementById('adminOverlay').addEventListener('click', e => { if (e.target === document.getElementById('adminOverlay')) closeAdmin(); });
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target === document.getElementById('lightbox')) closeLightbox(); });

  // Check URL for shared photo
  const params = new URLSearchParams(window.location.search);
  if (params.get('photo')) openLightbox(params.get('photo'));
});
