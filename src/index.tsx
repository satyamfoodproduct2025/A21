import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
}

type Variables = {
  isAdmin: boolean
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic())

// Simple password hash function (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const sessionToken = getCookie(c, 'admin_session')
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const decoded = atob(sessionToken)
    const [username, timestamp] = decoded.split(':')
    const sessionAge = Date.now() - parseInt(timestamp)
    
    // Session valid for 24 hours
    if (sessionAge > 24 * 60 * 60 * 1000) {
      deleteCookie(c, 'admin_session')
      return c.json({ error: 'Session expired' }, 401)
    }
    
    const admin = await c.env.DB.prepare('SELECT * FROM admin_users WHERE username = ?').bind(username).first()
    if (!admin) {
      return c.json({ error: 'Invalid session' }, 401)
    }
    
    c.set('isAdmin', true)
    await next()
  } catch (e) {
    return c.json({ error: 'Invalid session' }, 401)
  }
}

// ==================== PUBLIC API ROUTES ====================

// Get all public data for homepage
app.get('/api/public/data', async (c) => {
  try {
    const settings = await c.env.DB.prepare('SELECT setting_key, setting_value FROM site_settings').all()
    const slides = await c.env.DB.prepare('SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY display_order').all()
    const gallery = await c.env.DB.prepare('SELECT * FROM gallery_images WHERE is_active = 1 ORDER BY display_order').all()
    const socialLinks = await c.env.DB.prepare('SELECT * FROM social_links WHERE is_active = 1').all()
    
    const settingsObj: Record<string, string> = {}
    settings.results?.forEach((s: any) => {
      settingsObj[s.setting_key] = s.setting_value
    })
    
    return c.json({
      settings: settingsObj,
      slides: slides.results || [],
      gallery: gallery.results || [],
      socialLinks: socialLinks.results || []
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Submit contact form
app.post('/api/public/contact', async (c) => {
  try {
    const { name, mobile, shift_preference } = await c.req.json()
    
    if (!name || !mobile) {
      return c.json({ error: 'Name and mobile are required' }, 400)
    }
    
    await c.env.DB.prepare(
      'INSERT INTO contact_submissions (name, mobile, shift_preference) VALUES (?, ?, ?)'
    ).bind(name, mobile, shift_preference || '').run()
    
    return c.json({ success: true, message: 'Form submitted successfully' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ==================== ADMIN AUTH ROUTES ====================

// Admin login
app.post('/api/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ error: 'Username and password required' }, 400)
    }
    
    const passwordHash = await hashPassword(password)
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admin_users WHERE username = ? AND password_hash = ?'
    ).bind(username, passwordHash).first()
    
    if (!admin) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Create session token
    const sessionToken = btoa(`${username}:${Date.now()}`)
    setCookie(c, 'admin_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    return c.json({ success: true, message: 'Login successful' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Admin logout
app.post('/api/admin/logout', (c) => {
  deleteCookie(c, 'admin_session')
  return c.json({ success: true })
})

// Check admin session
app.get('/api/admin/check', adminAuth, (c) => {
  return c.json({ authenticated: true })
})

// ==================== ADMIN PROTECTED ROUTES ====================

// Get all settings
app.get('/api/admin/settings', adminAuth, async (c) => {
  try {
    const settings = await c.env.DB.prepare('SELECT * FROM site_settings').all()
    return c.json(settings.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Update setting
app.put('/api/admin/settings/:key', adminAuth, async (c) => {
  try {
    const key = c.req.param('key')
    const { value } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(value, key).run()
    
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Get all hero slides
app.get('/api/admin/slides', adminAuth, async (c) => {
  try {
    const slides = await c.env.DB.prepare('SELECT * FROM hero_slides ORDER BY display_order').all()
    return c.json(slides.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Add hero slide
app.post('/api/admin/slides', adminAuth, async (c) => {
  try {
    const { image_url, title, subtitle, display_order } = await c.req.json()
    
    const result = await c.env.DB.prepare(
      'INSERT INTO hero_slides (image_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)'
    ).bind(image_url, title, subtitle || '', display_order || 0).run()
    
    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Update hero slide
app.put('/api/admin/slides/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const { image_url, title, subtitle, display_order, is_active } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE hero_slides SET image_url = ?, title = ?, subtitle = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(image_url, title, subtitle || '', display_order || 0, is_active ? 1 : 0, id).run()
    
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Delete hero slide
app.delete('/api/admin/slides/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM hero_slides WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Get all gallery images
app.get('/api/admin/gallery', adminAuth, async (c) => {
  try {
    const gallery = await c.env.DB.prepare('SELECT * FROM gallery_images ORDER BY display_order').all()
    return c.json(gallery.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Add gallery image
app.post('/api/admin/gallery', adminAuth, async (c) => {
  try {
    const { image_url, alt_text, display_order } = await c.req.json()
    
    const result = await c.env.DB.prepare(
      'INSERT INTO gallery_images (image_url, alt_text, display_order) VALUES (?, ?, ?)'
    ).bind(image_url, alt_text || '', display_order || 0).run()
    
    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Update gallery image
app.put('/api/admin/gallery/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const { image_url, alt_text, display_order, is_active } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE gallery_images SET image_url = ?, alt_text = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(image_url, alt_text || '', display_order || 0, is_active ? 1 : 0, id).run()
    
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Delete gallery image
app.delete('/api/admin/gallery/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM gallery_images WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Get all social links
app.get('/api/admin/social', adminAuth, async (c) => {
  try {
    const links = await c.env.DB.prepare('SELECT * FROM social_links').all()
    return c.json(links.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Update social link
app.put('/api/admin/social/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const { platform, url, icon_class, is_active } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE social_links SET platform = ?, url = ?, icon_class = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(platform, url, icon_class || '', is_active ? 1 : 0, id).run()
    
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Add social link
app.post('/api/admin/social', adminAuth, async (c) => {
  try {
    const { platform, url, icon_class } = await c.req.json()
    
    const result = await c.env.DB.prepare(
      'INSERT INTO social_links (platform, url, icon_class) VALUES (?, ?, ?)'
    ).bind(platform, url, icon_class || '').run()
    
    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Delete social link
app.delete('/api/admin/social/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Get contact submissions
app.get('/api/admin/contacts', adminAuth, async (c) => {
  try {
    const contacts = await c.env.DB.prepare(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC'
    ).all()
    return c.json(contacts.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Change admin password
app.put('/api/admin/change-password', adminAuth, async (c) => {
  try {
    const { current_password, new_password, new_username } = await c.req.json()
    
    const sessionToken = getCookie(c, 'admin_session')
    const decoded = atob(sessionToken || '')
    const [username] = decoded.split(':')
    
    const currentHash = await hashPassword(current_password)
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admin_users WHERE username = ? AND password_hash = ?'
    ).bind(username, currentHash).first()
    
    if (!admin) {
      return c.json({ error: 'Current password is incorrect' }, 400)
    }
    
    const newHash = await hashPassword(new_password)
    const finalUsername = new_username || username
    
    await c.env.DB.prepare(
      'UPDATE admin_users SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(finalUsername, newHash, admin.id).run()
    
    // Update session with new username
    const newSessionToken = btoa(`${finalUsername}:${Date.now()}`)
    setCookie(c, 'admin_session', newSessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60
    })
    
    return c.json({ success: true, message: 'Credentials updated successfully' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ==================== PAGE ROUTES ====================

// Main Homepage
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Drishti Digital Library | Self Study Center</title>
    <meta name="description" content="Drishti Digital Library - Premium Self Study Center with AC, WiFi, CCTV. Best environment for competitive exam preparation.">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <div id="app">
        <div class="loader-container" id="loader">
            <div class="loader-spinner"></div>
            <p>Loading...</p>
        </div>
    </div>
    <script src="/static/app.js"></script>
</body>
</html>`)
})

// Admin Panel
app.get('/admin', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/static/admin.css">
</head>
<body>
    <div id="admin-app"></div>
    <script src="/static/admin.js"></script>
</body>
</html>`)
})

// Terms and Conditions
app.get('/terms', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms & Conditions | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: #f8fafc; color: #0f172a; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 30px; color: #0f172a; border-bottom: 3px solid #d97706; padding-bottom: 15px; }
        h2 { font-size: 1.5rem; margin: 30px 0 15px; color: #1e293b; }
        p, li { margin-bottom: 15px; color: #475569; }
        ul { padding-left: 25px; }
        .back-btn { display: inline-block; margin-bottom: 30px; padding: 12px 25px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .back-btn:hover { background: #b45309; }
        .last-updated { color: #94a3b8; font-size: 0.9rem; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Home</a>
        <h1>Terms & Conditions</h1>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using Drishti Digital Library services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
        
        <h2>2. Services Description</h2>
        <p>Drishti Digital Library provides self-study center facilities including:</p>
        <ul>
            <li>Air-conditioned study spaces</li>
            <li>High-speed WiFi connectivity</li>
            <li>CCTV surveillance for security</li>
            <li>Comfortable seating arrangements</li>
            <li>Newspaper and reading materials</li>
        </ul>
        
        <h2>3. Membership & Payment</h2>
        <ul>
            <li>Membership fees are non-refundable once the service period begins.</li>
            <li>All payments must be made through authorized payment channels only.</li>
            <li>Fees may be revised with prior notice to members.</li>
            <li>Monthly/shift-based subscriptions auto-expire at the end of the paid period.</li>
        </ul>
        
        <h2>4. User Responsibilities</h2>
        <ul>
            <li>Maintain silence and discipline in the study area.</li>
            <li>Do not damage library property or furniture.</li>
            <li>Personal belongings must be kept secure; the library is not responsible for lost items.</li>
            <li>Follow all rules and guidelines posted at the premises.</li>
            <li>Respect other members and staff.</li>
        </ul>
        
        <h2>5. Prohibited Activities</h2>
        <ul>
            <li>Smoking, alcohol, or any illegal substances on premises.</li>
            <li>Creating disturbance or noise.</li>
            <li>Damaging property or equipment.</li>
            <li>Unauthorized entry to restricted areas.</li>
            <li>Sharing membership with others.</li>
        </ul>
        
        <h2>6. Termination</h2>
        <p>We reserve the right to terminate membership without refund for violation of these terms or disruptive behavior.</p>
        
        <h2>7. Limitation of Liability</h2>
        <p>Drishti Digital Library shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
        
        <h2>8. Changes to Terms</h2>
        <p>We may modify these terms at any time. Continued use of services after changes constitutes acceptance of new terms.</p>
        
        <h2>9. Contact Information</h2>
        <p>For any questions regarding these terms, please contact us at our registered address or phone number provided on the website.</p>
        
        <p class="last-updated">Last Updated: January 2026</p>
    </div>
</body>
</html>`)
})

// Privacy Policy
app.get('/privacy', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: #f8fafc; color: #0f172a; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 30px; color: #0f172a; border-bottom: 3px solid #d97706; padding-bottom: 15px; }
        h2 { font-size: 1.5rem; margin: 30px 0 15px; color: #1e293b; }
        p, li { margin-bottom: 15px; color: #475569; }
        ul { padding-left: 25px; }
        .back-btn { display: inline-block; margin-bottom: 30px; padding: 12px 25px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .back-btn:hover { background: #b45309; }
        .last-updated { color: #94a3b8; font-size: 0.9rem; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Home</a>
        <h1>Privacy Policy</h1>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
            <li>Name and contact information (phone number, email)</li>
            <li>Payment information for membership fees</li>
            <li>Shift preferences and booking details</li>
            <li>CCTV footage for security purposes</li>
        </ul>
        
        <h2>2. How We Use Your Information</h2>
        <ul>
            <li>To provide and manage library services</li>
            <li>To process payments and send receipts</li>
            <li>To communicate about your membership and updates</li>
            <li>To ensure security and safety of all members</li>
            <li>To improve our services</li>
        </ul>
        
        <h2>3. Information Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
        <ul>
            <li>Payment processors for transaction processing</li>
            <li>Law enforcement when required by law</li>
            <li>Service providers who assist in our operations</li>
        </ul>
        
        <h2>4. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        
        <h2>5. CCTV Surveillance</h2>
        <p>Our premises are under 24/7 CCTV surveillance for security purposes. Footage is retained for a limited period and accessed only for security investigations.</p>
        
        <h2>6. Your Rights</h2>
        <ul>
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal requirements)</li>
            <li>Opt-out of promotional communications</li>
        </ul>
        
        <h2>7. Cookies</h2>
        <p>Our website may use cookies to enhance user experience. You can control cookie settings through your browser.</p>
        
        <h2>8. Changes to Privacy Policy</h2>
        <p>We may update this policy periodically. Changes will be posted on this page with an updated revision date.</p>
        
        <h2>9. Contact Us</h2>
        <p>For privacy-related inquiries, please contact us at our registered address or phone number.</p>
        
        <p class="last-updated">Last Updated: January 2026</p>
    </div>
</body>
</html>`)
})

// Refund Policy
app.get('/refund', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Policy | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: #f8fafc; color: #0f172a; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 30px; color: #0f172a; border-bottom: 3px solid #d97706; padding-bottom: 15px; }
        h2 { font-size: 1.5rem; margin: 30px 0 15px; color: #1e293b; }
        p, li { margin-bottom: 15px; color: #475569; }
        ul { padding-left: 25px; }
        .back-btn { display: inline-block; margin-bottom: 30px; padding: 12px 25px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .back-btn:hover { background: #b45309; }
        .last-updated { color: #94a3b8; font-size: 0.9rem; margin-top: 40px; }
        .highlight { background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #d97706; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Home</a>
        <h1>Refund & Cancellation Policy</h1>
        
        <div class="highlight">
            <strong>Important:</strong> Please read this policy carefully before making any payment.
        </div>
        
        <h2>1. General Policy</h2>
        <p>Drishti Digital Library membership fees are generally non-refundable once the service period has commenced. We encourage members to carefully consider their requirements before purchasing a membership.</p>
        
        <h2>2. Eligibility for Refund</h2>
        <p>Refunds may be considered in the following circumstances:</p>
        <ul>
            <li><strong>Before Service Commencement:</strong> Full refund if cancellation is requested before the membership start date.</li>
            <li><strong>Technical Issues:</strong> If payment is debited but membership is not activated due to technical errors.</li>
            <li><strong>Duplicate Payment:</strong> Full refund for accidental duplicate payments.</li>
            <li><strong>Service Unavailability:</strong> Proportionate refund if we are unable to provide services due to unforeseen circumstances.</li>
        </ul>
        
        <h2>3. Non-Refundable Cases</h2>
        <ul>
            <li>Change of mind after service commencement</li>
            <li>Violation of terms leading to membership termination</li>
            <li>Unused days in a membership period</li>
            <li>Upgrade or downgrade requests mid-cycle</li>
        </ul>
        
        <h2>4. Refund Process</h2>
        <ul>
            <li>Submit refund request via phone call or in person at our center.</li>
            <li>Provide payment receipt and membership details.</li>
            <li>Request will be reviewed within 3-5 business days.</li>
            <li>Approved refunds will be processed within 7-10 business days.</li>
            <li>Refund will be credited to the original payment method.</li>
        </ul>
        
        <h2>5. Cancellation</h2>
        <ul>
            <li>Members can cancel future renewals at any time.</li>
            <li>Current membership period will remain active until expiry.</li>
            <li>No partial refunds for early cancellation.</li>
        </ul>
        
        <h2>6. Contact for Refunds</h2>
        <p>For refund requests or queries, please contact:</p>
        <ul>
            <li>Visit our center in person during operating hours</li>
            <li>Call our helpline number</li>
            <li>WhatsApp us with your details</li>
        </ul>
        
        <h2>7. Policy Changes</h2>
        <p>We reserve the right to modify this refund policy. Any changes will be effective immediately upon posting.</p>
        
        <p class="last-updated">Last Updated: January 2026</p>
    </div>
</body>
</html>`)
})

// About Us
app.get('/about', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: #f8fafc; color: #0f172a; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 30px; color: #0f172a; border-bottom: 3px solid #d97706; padding-bottom: 15px; }
        h2 { font-size: 1.5rem; margin: 30px 0 15px; color: #1e293b; }
        p { margin-bottom: 15px; color: #475569; }
        .back-btn { display: inline-block; margin-bottom: 30px; padding: 12px 25px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .back-btn:hover { background: #b45309; }
        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
        .feature-box { background: white; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .feature-box i { font-size: 2.5rem; color: #d97706; margin-bottom: 15px; }
        .feature-box h3 { color: #0f172a; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Home</a>
        <h1>About Drishti Digital Library</h1>
        
        <p>Welcome to <strong>Drishti Digital Library</strong> - your premier self-study destination designed for serious students and competitive exam aspirants. We understand the importance of a peaceful, well-equipped environment for focused learning.</p>
        
        <h2>Our Mission</h2>
        <p>To provide students with a world-class study environment that fosters concentration, productivity, and academic success. We believe every student deserves access to premium study facilities at affordable prices.</p>
        
        <h2>Our Facilities</h2>
        <div class="features-grid">
            <div class="feature-box">
                <i class="fas fa-snowflake"></i>
                <h3>Fully AC</h3>
                <p>Climate-controlled environment for year-round comfort</p>
            </div>
            <div class="feature-box">
                <i class="fas fa-wifi"></i>
                <h3>High-Speed WiFi</h3>
                <p>Unlimited internet for research and online resources</p>
            </div>
            <div class="feature-box">
                <i class="fas fa-video"></i>
                <h3>CCTV Security</h3>
                <p>24/7 surveillance for your safety</p>
            </div>
            <div class="feature-box">
                <i class="fas fa-chair"></i>
                <h3>Comfortable Seating</h3>
                <p>Ergonomic chairs and spacious desks</p>
            </div>
            <div class="feature-box">
                <i class="fas fa-newspaper"></i>
                <h3>Newspapers</h3>
                <p>Daily newspapers for current affairs</p>
            </div>
            <div class="feature-box">
                <i class="fas fa-clock"></i>
                <h3>Flexible Timings</h3>
                <p>Multiple shift options to suit your schedule</p>
            </div>
        </div>
        
        <h2>Why Choose Us?</h2>
        <p>Drishti Digital Library stands out because we focus on creating the perfect study atmosphere. Our quiet environment, modern amenities, and dedicated staff ensure you can concentrate fully on your studies without distractions.</p>
        
        <h2>Contact Us</h2>
        <p>Ready to join? Contact us to learn about our membership plans and book your seat today!</p>
    </div>
</body>
</html>`)
})

// Contact Us
app.get('/contact', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us | Drishti Digital Library</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: #f8fafc; color: #0f172a; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 30px; color: #0f172a; border-bottom: 3px solid #d97706; padding-bottom: 15px; }
        .back-btn { display: inline-block; margin-bottom: 30px; padding: 12px 25px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .back-btn:hover { background: #b45309; }
        .contact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin: 30px 0; }
        .contact-box { background: white; padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .contact-box i { font-size: 2.5rem; color: #d97706; margin-bottom: 15px; }
        .contact-box h3 { color: #0f172a; margin-bottom: 10px; }
        .contact-box a { color: #475569; text-decoration: none; }
        .contact-box a:hover { color: #d97706; }
        @media (max-width: 600px) { .contact-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Home</a>
        <h1>Contact Us</h1>
        
        <div class="contact-grid">
            <div class="contact-box">
                <i class="fas fa-phone"></i>
                <h3>Phone</h3>
                <a href="tel:+919876543210">+91 98765 43210</a>
            </div>
            <div class="contact-box">
                <i class="fab fa-whatsapp"></i>
                <h3>WhatsApp</h3>
                <a href="https://wa.me/919876543210" target="_blank">Chat with us</a>
            </div>
            <div class="contact-box">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Address</h3>
                <p>Main Road, Near Bus Stand<br>Your City - 123456</p>
            </div>
            <div class="contact-box">
                <i class="fas fa-clock"></i>
                <h3>Operating Hours</h3>
                <p>6:00 AM - 10:00 PM<br>All Days</p>
            </div>
        </div>
    </div>
</body>
</html>`)
})

export default app
