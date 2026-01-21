// Drishti Digital Library - Frontend JavaScript

// Global state
let siteData = {
    settings: {},
    slides: [],
    gallery: [],
    socialLinks: []
};

// DOM Elements
const app = document.getElementById('app');

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

function getSetting(key, defaultValue = '') {
    return siteData.settings[key] || defaultValue;
}

// Fetch site data
async function fetchSiteData() {
    try {
        const response = await fetch('/api/public/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        siteData = await response.json();
        renderApp();
    } catch (error) {
        console.error('Error fetching data:', error);
        // Render with default data
        renderApp();
    }
}

// Render the entire app
function renderApp() {
    const loader = document.getElementById('loader');
    
    app.innerHTML = `
        ${renderWhatsAppFloat()}
        ${renderNavbar()}
        ${renderHeroSlider()}
        ${renderShiftsSection()}
        ${renderFacilitiesSection()}
        ${renderGallerySection()}
        ${renderBookingSection()}
        ${renderMapSection()}
        ${renderFooter()}
        <div class="toast" id="toast"></div>
    `;
    
    // Hide loader
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
    }
    
    // Initialize components
    initSlider();
    initScrollReveal();
    initNavbarScroll();
    initContactForm();
}

// Render WhatsApp Float Button
function renderWhatsAppFloat() {
    const whatsappNumber = getSetting('whatsapp_number', '919876543210');
    return `
        <a href="https://wa.me/${whatsappNumber}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
    `;
}

// Render Navbar
function renderNavbar() {
    const logoText = getSetting('logo_text', 'DRISHTI');
    const logoHighlight = getSetting('logo_highlight', 'LIBRARY');
    const phoneNumber = getSetting('phone_number', '+91 98765 43210');
    
    return `
        <nav class="navbar" id="navbar">
            <div class="logo">
                <i class="fas fa-book-open"></i>
                ${logoText}<span>${logoHighlight}</span>
            </div>
            <div class="nav-links">
                <a href="/about" class="nav-btn">
                    <i class="fas fa-info-circle"></i>
                    <span>About</span>
                </a>
                <a href="/contact" class="nav-btn">
                    <i class="fas fa-envelope"></i>
                    <span>Contact</span>
                </a>
                <a href="tel:${phoneNumber.replace(/\s/g, '')}" class="nav-btn highlight">
                    <i class="fas fa-phone"></i>
                    <span>Call</span>
                </a>
            </div>
        </nav>
    `;
}

// Render Hero Slider
function renderHeroSlider() {
    const slides = siteData.slides.length > 0 ? siteData.slides : [
        { image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1350&q=80', title: 'शान्त वातावरण, बेहतर पढ़ाई', subtitle: 'Drishti Digital Library में आपका स्वागत है।' },
        { image_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1350&q=80', title: 'Focus on Your Success', subtitle: 'आधुनिक सुविधाओं के साथ अपनी मंज़िल को पाएं।' }
    ];
    
    const slidesHTML = slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image_url}');">
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <h1>${slide.title}</h1>
                <p>${slide.subtitle || ''}</p>
            </div>
        </div>
    `).join('');
    
    const dotsHTML = slides.map((_, index) => `
        <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');
    
    return `
        <section class="hero-slider" id="hero">
            ${slidesHTML}
            <div class="slider-dots">
                ${dotsHTML}
            </div>
        </section>
    `;
}

// Render Shifts Section
function renderShiftsSection() {
    const shifts = [
        { icon: 'fa-coffee', title: '06-10 AM', desc: 'सुबह की ताज़गी' },
        { icon: 'fa-sun', title: '10-02 PM', desc: 'दिन का जोश' },
        { icon: 'fa-cloud-sun', title: '02-06 PM', desc: 'शाम की एकाग्रता' },
        { icon: 'fa-moon', title: '06-10 PM', desc: 'रात का सुकून' }
    ];
    
    const cardsHTML = shifts.map(shift => `
        <div class="card">
            <div class="card-icon">
                <i class="fas ${shift.icon}"></i>
            </div>
            <h3>${shift.title}</h3>
            <p>${shift.desc}</p>
        </div>
    `).join('');
    
    return `
        <section class="section reveal" id="shifts">
            <div class="section-header">
                <h2>हमारी शिफ्ट्स</h2>
                <p class="section-subtitle">अपनी सुविधा अनुसार शिफ्ट चुनें</p>
            </div>
            <div class="card-grid">
                ${cardsHTML}
            </div>
        </section>
    `;
}

// Render Facilities Section
function renderFacilitiesSection() {
    const facilities = [
        { icon: 'fa-snowflake', title: 'Fully AC', desc: 'पूरी तरह वातानुकूलित' },
        { icon: 'fa-wifi', title: 'High Speed WiFi', desc: 'तेज़ इंटरनेट' },
        { icon: 'fa-video', title: 'CCTV Camera', desc: '24/7 सुरक्षा' },
        { icon: 'fa-newspaper', title: 'Newspapers', desc: 'दैनिक समाचार पत्र' },
        { icon: 'fa-chair', title: 'Comfortable Seating', desc: 'आरामदायक बैठक' },
        { icon: 'fa-bolt', title: 'Power Backup', desc: 'बिजली बैकअप' }
    ];
    
    const cardsHTML = facilities.map(facility => `
        <div class="card">
            <div class="card-icon">
                <i class="fas ${facility.icon}"></i>
            </div>
            <h3>${facility.title}</h3>
            <p>${facility.desc}</p>
        </div>
    `).join('');
    
    return `
        <section class="section bg-white reveal" id="facilities">
            <div class="section-header">
                <h2>प्रीमियम सुविधाएँ</h2>
                <p class="section-subtitle">बेस्ट-इन-क्लास स्टडी एनवायरनमेंट</p>
            </div>
            <div class="card-grid">
                ${cardsHTML}
            </div>
        </section>
    `;
}

// Render Gallery Section
function renderGallerySection() {
    const gallery = siteData.gallery.length > 0 ? siteData.gallery : [
        { image_url: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=600&q=80', alt_text: 'Library' },
        { image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', alt_text: 'Books' },
        { image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80', alt_text: 'Study' },
        { image_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80', alt_text: 'Reading' }
    ];
    
    const itemsHTML = gallery.map(item => `
        <div class="gallery-item">
            <img src="${item.image_url}" alt="${item.alt_text || 'Gallery Image'}" loading="lazy">
        </div>
    `).join('');
    
    return `
        <section class="section reveal" id="gallery">
            <div class="section-header">
                <h2>लाइब्रेरी की झलक</h2>
                <p class="section-subtitle">हमारी सुविधाओं को देखें</p>
            </div>
            <div class="gallery-grid">
                ${itemsHTML}
            </div>
        </section>
    `;
}

// Render Booking Section
function renderBookingSection() {
    return `
        <section class="section booking-section reveal" id="booking">
            <div class="booking-container">
                <div class="booking-info">
                    <h2>आज ही जुड़ें!</h2>
                    <p>फॉर्म भरें, हम आपसे संपर्क करके फीस और सीट की जानकारी देंगे।</p>
                    <ul class="booking-features">
                        <li><i class="fas fa-check-circle"></i> Low Price Guarantee</li>
                        <li><i class="fas fa-check-circle"></i> Permanent Seat Option</li>
                        <li><i class="fas fa-check-circle"></i> Flexible Timings</li>
                        <li><i class="fas fa-check-circle"></i> Free Trial Available</li>
                    </ul>
                </div>
                <div class="booking-form">
                    <h3>Book Your Seat</h3>
                    <form id="contactForm">
                        <div class="form-group">
                            <label for="name">आपका नाम *</label>
                            <input type="text" id="name" name="name" placeholder="पूरा नाम दर्ज करें" required>
                        </div>
                        <div class="form-group">
                            <label for="mobile">मोबाइल नंबर *</label>
                            <input type="tel" id="mobile" name="mobile" placeholder="10 अंकों का नंबर" pattern="[0-9]{10}" required>
                        </div>
                        <div class="form-group">
                            <label for="shift">शिफ्ट चुनें</label>
                            <select id="shift" name="shift">
                                <option value="Morning (06-10 AM)">Morning (06-10 AM)</option>
                                <option value="Noon (10-02 PM)">Noon (10-02 PM)</option>
                                <option value="Evening (02-06 PM)">Evening (02-06 PM)</option>
                                <option value="Night (06-10 PM)">Night (06-10 PM)</option>
                                <option value="Full Day Session">Full Day Session</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-submit" id="submitBtn">
                            <i class="fas fa-paper-plane"></i>
                            डिटेल्स भेजें
                        </button>
                    </form>
                </div>
            </div>
        </section>
    `;
}

// Render Map Section
function renderMapSection() {
    const mapUrl = getSetting('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m13!1d58842.16434850721!2d86.1558223405761!3d22.815918731175654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f5e31989f0e2b3%3A0x4560124953c80051!2sSakchi%2C%20Jamshedpur%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin');
    
    return `
        <section class="map-section reveal">
            <div class="map-container">
                <iframe 
                    src="${mapUrl}" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Location Map">
                </iframe>
            </div>
        </section>
    `;
}

// Render Footer
function renderFooter() {
    const siteName = getSetting('site_name', 'Drishti Digital Library');
    const logoText = getSetting('logo_text', 'DRISHTI');
    const logoHighlight = getSetting('logo_highlight', 'LIBRARY');
    const address = getSetting('address', 'Main Road, Near Bus Stand, Your City - 123456');
    const phoneNumber = getSetting('phone_number', '+91 98765 43210');
    const footerText = getSetting('footer_text', '© 2026 Drishti Digital Library. All Rights Reserved.');
    
    const socialLinks = siteData.socialLinks.length > 0 ? siteData.socialLinks : [
        { platform: 'whatsapp', url: 'https://wa.me/919876543210', icon_class: 'fab fa-whatsapp' },
        { platform: 'instagram', url: '#', icon_class: 'fab fa-instagram' },
        { platform: 'facebook', url: '#', icon_class: 'fab fa-facebook-f' },
        { platform: 'youtube', url: '#', icon_class: 'fab fa-youtube' }
    ];
    
    const socialLinksHTML = socialLinks.map(link => `
        <a href="${link.url}" class="social-link ${link.platform}" target="_blank" rel="noopener" aria-label="${link.platform}">
            <i class="${link.icon_class}"></i>
        </a>
    `).join('');
    
    return `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-logo">
                    ${logoText}<span>${logoHighlight}</span>
                </div>
                <p class="footer-address">${address}</p>
                <p class="footer-phone">Helpline: <a href="tel:${phoneNumber.replace(/\s/g, '')}">${phoneNumber}</a></p>
                
                <div class="social-links">
                    ${socialLinksHTML}
                </div>
                
                <div class="footer-links">
                    <a href="/about">About Us</a>
                    <a href="/contact">Contact</a>
                    <a href="/terms">Terms & Conditions</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/refund">Refund Policy</a>
                </div>
                
                <p class="copyright">${footerText}</p>
            </div>
        </footer>
    `;
}

// Initialize Hero Slider
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoSlide() {
        clearInterval(slideInterval);
    }
    
    // Click on dots
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(parseInt(dot.dataset.index));
            startAutoSlide();
        });
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoSlide();
        }, { passive: true });
    }
    
    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe left - next slide
                showSlide((currentSlide + 1) % slides.length);
            } else {
                // Swipe right - previous slide
                showSlide((currentSlide - 1 + slides.length) % slides.length);
            }
        }
    }
    
    startAutoSlide();
}

// Initialize Scroll Reveal Animation
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        reveals.forEach(reveal => {
            const windowHeight = window.innerHeight;
            const elementTop = reveal.getBoundingClientRect().top;
            const revealPoint = 100;
            
            if (elementTop < windowHeight - revealPoint) {
                reveal.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', checkReveal, { passive: true });
    checkReveal(); // Initial check
}

// Initialize Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// Initialize Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> भेज रहे हैं...';
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            shift_preference: document.getElementById('shift').value
        };
        
        try {
            const response = await fetch('/api/public/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('धन्यवाद! हम आपसे जल्द संपर्क करेंगे।', 'success');
                form.reset();
            } else {
                showToast(result.error || 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।', 'error');
            }
        } catch (error) {
            showToast('नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', fetchSiteData);
