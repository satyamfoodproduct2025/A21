// Drishti Digital Library - Admin Panel JavaScript

// Global state
let isAuthenticated = false;
let currentPage = 'dashboard';
let adminData = {
    settings: [],
    slides: [],
    gallery: [],
    socialLinks: [],
    contacts: []
};

const adminApp = document.getElementById('admin-app');

// Utility Functions
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/check', { credentials: 'include' });
        if (response.ok) {
            isAuthenticated = true;
            await loadAllData();
            renderDashboard();
        } else {
            renderLogin();
        }
    } catch (error) {
        renderLogin();
    }
}

// Login function
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.querySelector('.btn-primary');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    errorEl.textContent = '';
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            isAuthenticated = true;
            await loadAllData();
            renderDashboard();
            showToast('Login successful!', 'success');
        } else {
            errorEl.textContent = result.error || 'Invalid credentials';
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

// Logout function
async function handleLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    isAuthenticated = false;
    renderLogin();
    showToast('Logged out successfully', 'success');
}

// Load all admin data
async function loadAllData() {
    try {
        const [settings, slides, gallery, social, contacts] = await Promise.all([
            fetch('/api/admin/settings', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/admin/slides', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/admin/gallery', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/admin/social', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/admin/contacts', { credentials: 'include' }).then(r => r.json())
        ]);
        
        adminData.settings = settings || [];
        adminData.slides = slides || [];
        adminData.gallery = gallery || [];
        adminData.socialLinks = social || [];
        adminData.contacts = contacts || [];
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Render Login Page
function renderLogin() {
    adminApp.innerHTML = `
        <div class="login-container">
            <div class="login-box">
                <i class="fas fa-user-shield logo-icon"></i>
                <h1>Admin Login</h1>
                <p>Drishti Digital Library - Admin Panel</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="Enter username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="Enter password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <p class="error-msg" id="loginError"></p>
                </form>
                <p style="margin-top: 20px; font-size: 0.85rem; color: #94a3b8;">
                    <a href="/" style="color: #d97706;">← Back to Website</a>
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Render Dashboard
function renderDashboard() {
    adminApp.innerHTML = `
        <div class="admin-layout">
            ${renderSidebar()}
            <main class="main-content">
                <div id="page-content"></div>
            </main>
            <nav class="mobile-nav" style="display: none;">
                ${renderMobileNav()}
            </nav>
        </div>
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal" id="modal"></div>
        </div>
    `;
    
    // Initialize sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            currentPage = item.dataset.page;
            updateActivePage();
            renderPageContent();
        });
    });
    
    // Show mobile nav on small screens
    if (window.innerWidth <= 768) {
        document.querySelector('.mobile-nav').style.display = 'flex';
    }
    
    renderPageContent();
}

function renderSidebar() {
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2><i class="fas fa-book-open"></i> <span>Admin Panel</span></h2>
            </div>
            <nav class="sidebar-nav">
                <button class="nav-item active" data-page="dashboard">
                    <i class="fas fa-tachometer-alt"></i> <span>Dashboard</span>
                </button>
                <button class="nav-item" data-page="settings">
                    <i class="fas fa-cog"></i> <span>Site Settings</span>
                </button>
                <button class="nav-item" data-page="slides">
                    <i class="fas fa-images"></i> <span>Hero Slides</span>
                </button>
                <button class="nav-item" data-page="gallery">
                    <i class="fas fa-photo-video"></i> <span>Gallery</span>
                </button>
                <button class="nav-item" data-page="social">
                    <i class="fas fa-share-alt"></i> <span>Social Links</span>
                </button>
                <button class="nav-item" data-page="contacts">
                    <i class="fas fa-address-book"></i> <span>Contacts</span>
                </button>
                <button class="nav-item" data-page="security">
                    <i class="fas fa-lock"></i> <span>Security</span>
                </button>
                <button class="nav-item" onclick="handleLogout()">
                    <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                </button>
            </nav>
        </aside>
    `;
}

function renderMobileNav() {
    return `
        <button class="nav-item active" data-page="dashboard">
            <i class="fas fa-home"></i> <span>Home</span>
        </button>
        <button class="nav-item" data-page="settings">
            <i class="fas fa-cog"></i> <span>Settings</span>
        </button>
        <button class="nav-item" data-page="slides">
            <i class="fas fa-images"></i> <span>Slides</span>
        </button>
        <button class="nav-item" data-page="gallery">
            <i class="fas fa-photo-video"></i> <span>Gallery</span>
        </button>
        <button class="nav-item" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
        </button>
    `;
}

function updateActivePage() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.classList.toggle('active', item.dataset.page === currentPage);
    });
}

function renderPageContent() {
    const content = document.getElementById('page-content');
    
    switch (currentPage) {
        case 'dashboard':
            content.innerHTML = renderDashboardPage();
            break;
        case 'settings':
            content.innerHTML = renderSettingsPage();
            initSettingsForm();
            break;
        case 'slides':
            content.innerHTML = renderSlidesPage();
            initSlidesHandlers();
            break;
        case 'gallery':
            content.innerHTML = renderGalleryPage();
            initGalleryHandlers();
            break;
        case 'social':
            content.innerHTML = renderSocialPage();
            initSocialHandlers();
            break;
        case 'contacts':
            content.innerHTML = renderContactsPage();
            break;
        case 'security':
            content.innerHTML = renderSecurityPage();
            initSecurityForm();
            break;
        default:
            content.innerHTML = renderDashboardPage();
    }
}

// Dashboard Page
function renderDashboardPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-tachometer-alt"></i> Dashboard</h1>
            <a href="/" class="back-to-site" target="_blank"><i class="fas fa-external-link-alt"></i> View Website</a>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-images"></i></div>
                <div class="stat-info">
                    <h4>${adminData.slides.length}</h4>
                    <p>Hero Slides</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-photo-video"></i></div>
                <div class="stat-info">
                    <h4>${adminData.gallery.length}</h4>
                    <p>Gallery Images</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-share-alt"></i></div>
                <div class="stat-info">
                    <h4>${adminData.socialLinks.length}</h4>
                    <p>Social Links</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-envelope"></i></div>
                <div class="stat-info">
                    <h4>${adminData.contacts.length}</h4>
                    <p>Enquiries</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clock"></i> Recent Enquiries</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Shift</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.contacts.slice(0, 5).map(c => `
                            <tr>
                                <td>${c.name}</td>
                                <td><a href="tel:${c.mobile}">${c.mobile}</a></td>
                                <td>${c.shift_preference || '-'}</td>
                                <td>${new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" style="text-align:center;">No enquiries yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Settings Page
function renderSettingsPage() {
    const getSettingValue = (key) => {
        const setting = adminData.settings.find(s => s.setting_key === key);
        return setting ? setting.setting_value : '';
    };
    
    return `
        <div class="page-header">
            <h1><i class="fas fa-cog"></i> Site Settings</h1>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-globe"></i> General Settings</h3>
            </div>
            <form id="settingsForm">
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Site Name</label>
                        <input type="text" name="site_name" value="${getSettingValue('site_name')}" placeholder="Drishti Digital Library">
                    </div>
                    <div class="setting-item">
                        <label>Tagline</label>
                        <input type="text" name="site_tagline" value="${getSettingValue('site_tagline')}" placeholder="Self Study Center">
                    </div>
                    <div class="setting-item">
                        <label>Logo Text (Part 1)</label>
                        <input type="text" name="logo_text" value="${getSettingValue('logo_text')}" placeholder="DRISHTI">
                    </div>
                    <div class="setting-item">
                        <label>Logo Text (Part 2 - Highlighted)</label>
                        <input type="text" name="logo_highlight" value="${getSettingValue('logo_highlight')}" placeholder="LIBRARY">
                    </div>
                </div>
                
                <h3 style="margin: 30px 0 20px; display: flex; align-items: center; gap: 10px;"><i class="fas fa-phone" style="color: var(--accent);"></i> Contact Information</h3>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Phone Number</label>
                        <input type="text" name="phone_number" value="${getSettingValue('phone_number')}" placeholder="+91 98765 43210">
                    </div>
                    <div class="setting-item">
                        <label>WhatsApp Number (without +)</label>
                        <input type="text" name="whatsapp_number" value="${getSettingValue('whatsapp_number')}" placeholder="919876543210">
                    </div>
                    <div class="setting-item" style="grid-column: 1 / -1;">
                        <label>Address</label>
                        <input type="text" name="address" value="${getSettingValue('address')}" placeholder="Full Address">
                    </div>
                </div>
                
                <h3 style="margin: 30px 0 20px; display: flex; align-items: center; gap: 10px;"><i class="fas fa-map-marker-alt" style="color: var(--accent);"></i> Google Map</h3>
                <div class="setting-item">
                    <label>Google Maps Embed URL</label>
                    <textarea name="map_embed_url" placeholder="https://www.google.com/maps/embed?pb=...">${getSettingValue('map_embed_url')}</textarea>
                    <small style="color: #94a3b8;">Go to Google Maps → Share → Embed a map → Copy the src URL</small>
                </div>
                
                <h3 style="margin: 30px 0 20px; display: flex; align-items: center; gap: 10px;"><i class="fas fa-file-alt" style="color: var(--accent);"></i> Footer</h3>
                <div class="setting-item">
                    <label>Copyright Text</label>
                    <input type="text" name="footer_text" value="${getSettingValue('footer_text')}" placeholder="© 2026 Drishti Digital Library. All Rights Reserved.">
                </div>
                
                <button type="submit" class="btn btn-primary" style="margin-top: 30px;">
                    <i class="fas fa-save"></i> Save Settings
                </button>
            </form>
        </div>
    `;
}

function initSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const formData = new FormData(form);
        const updates = [];
        
        for (let [key, value] of formData.entries()) {
            updates.push(
                fetch(`/api/admin/settings/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ value })
                })
            );
        }
        
        try {
            await Promise.all(updates);
            await loadAllData();
            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            showToast('Error saving settings', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
        }
    });
}

// Slides Page
function renderSlidesPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-images"></i> Hero Slides</h1>
            <button class="btn btn-primary" onclick="openSlideModal()">
                <i class="fas fa-plus"></i> Add Slide
            </button>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Subtitle</th>
                            <th>Order</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.slides.map(slide => `
                            <tr>
                                <td><img src="${slide.image_url}" class="table-img" alt="Slide"></td>
                                <td>${slide.title}</td>
                                <td>${slide.subtitle || '-'}</td>
                                <td>${slide.display_order}</td>
                                <td><span class="status-badge ${slide.is_active ? 'active' : 'inactive'}">${slide.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="editSlide(${slide.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="deleteSlide(${slide.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="6" style="text-align:center;">No slides yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function initSlidesHandlers() {
    window.openSlideModal = (slide = null) => {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${slide ? 'Edit Slide' : 'Add New Slide'}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="slideForm">
                    <input type="hidden" name="id" value="${slide?.id || ''}">
                    <div class="form-group">
                        <label>Image URL *</label>
                        <input type="url" name="image_url" value="${slide?.image_url || ''}" required placeholder="https://images.unsplash.com/...">
                    </div>
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" value="${slide?.title || ''}" required placeholder="Slide Title">
                    </div>
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" name="subtitle" value="${slide?.subtitle || ''}" placeholder="Slide Subtitle">
                    </div>
                    <div class="form-group">
                        <label>Display Order</label>
                        <input type="number" name="display_order" value="${slide?.display_order || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_active" ${slide?.is_active !== 0 ? 'checked' : ''}> Active
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveSlide()">Save</button>
            </div>
        `;
        
        overlay.classList.add('active');
    };
    
    window.editSlide = (id) => {
        const slide = adminData.slides.find(s => s.id === id);
        if (slide) openSlideModal(slide);
    };
    
    window.saveSlide = async () => {
        const form = document.getElementById('slideForm');
        const formData = new FormData(form);
        const id = formData.get('id');
        
        const data = {
            image_url: formData.get('image_url'),
            title: formData.get('title'),
            subtitle: formData.get('subtitle'),
            display_order: parseInt(formData.get('display_order')) || 0,
            is_active: formData.get('is_active') === 'on'
        };
        
        try {
            const url = id ? `/api/admin/slides/${id}` : '/api/admin/slides';
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                await loadAllData();
                closeModal();
                renderPageContent();
                showToast('Slide saved successfully!', 'success');
            } else {
                showToast('Error saving slide', 'error');
            }
        } catch (error) {
            showToast('Error saving slide', 'error');
        }
    };
    
    window.deleteSlide = async (id) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;
        
        try {
            const response = await fetch(`/api/admin/slides/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                await loadAllData();
                renderPageContent();
                showToast('Slide deleted successfully!', 'success');
            }
        } catch (error) {
            showToast('Error deleting slide', 'error');
        }
    };
}

// Gallery Page
function renderGalleryPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-photo-video"></i> Gallery</h1>
            <button class="btn btn-primary" onclick="openGalleryModal()">
                <i class="fas fa-plus"></i> Add Image
            </button>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Alt Text</th>
                            <th>Order</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.gallery.map(img => `
                            <tr>
                                <td><img src="${img.image_url}" class="table-img" alt="Gallery"></td>
                                <td>${img.alt_text || '-'}</td>
                                <td>${img.display_order}</td>
                                <td><span class="status-badge ${img.is_active ? 'active' : 'inactive'}">${img.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="editGallery(${img.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="deleteGallery(${img.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align:center;">No images yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function initGalleryHandlers() {
    window.openGalleryModal = (img = null) => {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${img ? 'Edit Image' : 'Add New Image'}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="galleryForm">
                    <input type="hidden" name="id" value="${img?.id || ''}">
                    <div class="form-group">
                        <label>Image URL *</label>
                        <input type="url" name="image_url" value="${img?.image_url || ''}" required placeholder="https://images.unsplash.com/...">
                    </div>
                    <div class="form-group">
                        <label>Alt Text</label>
                        <input type="text" name="alt_text" value="${img?.alt_text || ''}" placeholder="Image description">
                    </div>
                    <div class="form-group">
                        <label>Display Order</label>
                        <input type="number" name="display_order" value="${img?.display_order || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_active" ${img?.is_active !== 0 ? 'checked' : ''}> Active
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveGallery()">Save</button>
            </div>
        `;
        
        overlay.classList.add('active');
    };
    
    window.editGallery = (id) => {
        const img = adminData.gallery.find(g => g.id === id);
        if (img) openGalleryModal(img);
    };
    
    window.saveGallery = async () => {
        const form = document.getElementById('galleryForm');
        const formData = new FormData(form);
        const id = formData.get('id');
        
        const data = {
            image_url: formData.get('image_url'),
            alt_text: formData.get('alt_text'),
            display_order: parseInt(formData.get('display_order')) || 0,
            is_active: formData.get('is_active') === 'on'
        };
        
        try {
            const url = id ? `/api/admin/gallery/${id}` : '/api/admin/gallery';
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                await loadAllData();
                closeModal();
                renderPageContent();
                showToast('Image saved successfully!', 'success');
            }
        } catch (error) {
            showToast('Error saving image', 'error');
        }
    };
    
    window.deleteGallery = async (id) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        
        try {
            await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE', credentials: 'include' });
            await loadAllData();
            renderPageContent();
            showToast('Image deleted successfully!', 'success');
        } catch (error) {
            showToast('Error deleting image', 'error');
        }
    };
}

// Social Links Page
function renderSocialPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-share-alt"></i> Social Links</h1>
            <button class="btn btn-primary" onclick="openSocialModal()">
                <i class="fas fa-plus"></i> Add Link
            </button>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Platform</th>
                            <th>URL</th>
                            <th>Icon</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.socialLinks.map(link => `
                            <tr>
                                <td style="text-transform: capitalize;">${link.platform}</td>
                                <td><a href="${link.url}" target="_blank" style="color: var(--accent);">${link.url.substring(0, 40)}...</a></td>
                                <td><i class="${link.icon_class}"></i></td>
                                <td><span class="status-badge ${link.is_active ? 'active' : 'inactive'}">${link.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="editSocial(${link.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="deleteSocial(${link.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align:center;">No links yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function initSocialHandlers() {
    window.openSocialModal = (link = null) => {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${link ? 'Edit Social Link' : 'Add Social Link'}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="socialForm">
                    <input type="hidden" name="id" value="${link?.id || ''}">
                    <div class="form-group">
                        <label>Platform *</label>
                        <select name="platform" required>
                            <option value="whatsapp" ${link?.platform === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                            <option value="instagram" ${link?.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                            <option value="facebook" ${link?.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                            <option value="youtube" ${link?.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                            <option value="twitter" ${link?.platform === 'twitter' ? 'selected' : ''}>Twitter</option>
                            <option value="linkedin" ${link?.platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                            <option value="telegram" ${link?.platform === 'telegram' ? 'selected' : ''}>Telegram</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>URL *</label>
                        <input type="url" name="url" value="${link?.url || ''}" required placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>Icon Class</label>
                        <input type="text" name="icon_class" value="${link?.icon_class || 'fab fa-'}" placeholder="fab fa-whatsapp">
                        <small style="color: #94a3b8;">FontAwesome class (e.g., fab fa-whatsapp)</small>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_active" ${link?.is_active !== 0 ? 'checked' : ''}> Active
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveSocial()">Save</button>
            </div>
        `;
        
        overlay.classList.add('active');
    };
    
    window.editSocial = (id) => {
        const link = adminData.socialLinks.find(s => s.id === id);
        if (link) openSocialModal(link);
    };
    
    window.saveSocial = async () => {
        const form = document.getElementById('socialForm');
        const formData = new FormData(form);
        const id = formData.get('id');
        
        const data = {
            platform: formData.get('platform'),
            url: formData.get('url'),
            icon_class: formData.get('icon_class'),
            is_active: formData.get('is_active') === 'on'
        };
        
        try {
            const url = id ? `/api/admin/social/${id}` : '/api/admin/social';
            const method = id ? 'PUT' : 'POST';
            
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            await loadAllData();
            closeModal();
            renderPageContent();
            showToast('Social link saved!', 'success');
        } catch (error) {
            showToast('Error saving', 'error');
        }
    };
    
    window.deleteSocial = async (id) => {
        if (!confirm('Delete this social link?')) return;
        
        try {
            await fetch(`/api/admin/social/${id}`, { method: 'DELETE', credentials: 'include' });
            await loadAllData();
            renderPageContent();
            showToast('Deleted!', 'success');
        } catch (error) {
            showToast('Error', 'error');
        }
    };
}

// Contacts Page
function renderContactsPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-address-book"></i> Contact Enquiries</h1>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Shift Preference</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminData.contacts.map((c, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${c.name}</td>
                                <td><a href="tel:${c.mobile}" style="color: var(--accent);">${c.mobile}</a></td>
                                <td>${c.shift_preference || '-'}</td>
                                <td>${new Date(c.created_at).toLocaleString()}</td>
                                <td>
                                    <a href="https://wa.me/91${c.mobile}" target="_blank" class="btn btn-success btn-sm">
                                        <i class="fab fa-whatsapp"></i> WhatsApp
                                    </a>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="6" style="text-align:center;">No enquiries yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Security Page
function renderSecurityPage() {
    return `
        <div class="page-header">
            <h1><i class="fas fa-lock"></i> Security Settings</h1>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-key"></i> Change Credentials</h3>
            </div>
            <form id="securityForm" style="max-width: 500px;">
                <div class="form-group">
                    <label>New Username (optional)</label>
                    <input type="text" name="new_username" placeholder="Leave empty to keep current">
                </div>
                <div class="form-group">
                    <label>Current Password *</label>
                    <input type="password" name="current_password" required placeholder="Enter current password">
                </div>
                <div class="form-group">
                    <label>New Password *</label>
                    <input type="password" name="new_password" required placeholder="Enter new password" minlength="6">
                </div>
                <div class="form-group">
                    <label>Confirm New Password *</label>
                    <input type="password" name="confirm_password" required placeholder="Confirm new password">
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Update Credentials
                </button>
                <p id="securityError" class="error-msg"></p>
            </form>
        </div>
        
        <div class="card" style="margin-top: 30px; background: #fef3c7; border-left: 4px solid var(--accent);">
            <h3 style="margin-bottom: 15px;"><i class="fas fa-info-circle" style="color: var(--accent);"></i> Important Note</h3>
            <p style="color: #78350f;">To change credentials via Cloudflare Dashboard:</p>
            <ol style="margin-left: 20px; margin-top: 10px; color: #78350f;">
                <li>Go to Cloudflare Dashboard → D1 Database</li>
                <li>Select your database</li>
                <li>Go to "Console" tab</li>
                <li>Run SQL to update admin_users table</li>
            </ol>
        </div>
    `;
}

function initSecurityForm() {
    const form = document.getElementById('securityForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('securityError');
        errorEl.textContent = '';
        
        const formData = new FormData(form);
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }
        
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    current_password: formData.get('current_password'),
                    new_password: newPassword,
                    new_username: formData.get('new_username') || undefined
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('Credentials updated successfully!', 'success');
                form.reset();
            } else {
                errorEl.textContent = result.error || 'Error updating credentials';
            }
        } catch (error) {
            errorEl.textContent = 'Network error';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Update Credentials';
        }
    });
}

// Modal helper
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);
