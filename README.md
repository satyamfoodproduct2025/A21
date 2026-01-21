# Drishti Digital Library

A modern, attractive self-study center website with admin panel built using Hono + Cloudflare Pages + D1 Database.

## Live Demo

**Website:** https://3000-ie73p6kirz4td4n9iead0-c81df28e.sandbox.novita.ai

## Features

### Public Website
- **Hero Slider** - Auto-sliding hero section with beautiful images
- **Shifts Section** - 4 shift timings displayed in 2-column grid
- **Facilities Section** - Premium features (AC, WiFi, CCTV, etc.) in 2-column grid
- **Gallery Section** - Library photos in 2-column grid
- **Contact Form** - Enquiry form with shift selection
- **Google Map** - Embedded location map
- **WhatsApp Float Button** - Direct WhatsApp contact
- **Social Links** - WhatsApp, Instagram, Facebook, YouTube

### Admin Panel (`/admin`)
- **Dashboard** - Overview with statistics
- **Site Settings** - Logo, phone, address, map URL, footer
- **Hero Slides** - Add/Edit/Delete slides
- **Gallery** - Add/Edit/Delete images
- **Social Links** - Manage all social media links
- **Contact Enquiries** - View all form submissions
- **Security** - Change username/password

### Legal Pages (for Payment Gateway)
- `/terms` - Terms & Conditions
- `/privacy` - Privacy Policy
- `/refund` - Refund & Cancellation Policy
- `/about` - About Us
- `/contact` - Contact Page

## Default Admin Credentials

```
Username: admin
Password: admin123
```

**Important:** Change these immediately after first login!

## Tech Stack

- **Framework:** Hono.js
- **Frontend:** Vanilla JS + TailwindCSS (CDN)
- **Database:** Cloudflare D1 (SQLite)
- **Deployment:** Cloudflare Pages
- **Icons:** Font Awesome 6

## Responsive Design

The website maintains a **2-column grid layout** on all devices including mobile. Cards do not stack vertically - they scale down with smaller fonts to fit the mobile screen.

## Project Structure

```
webapp/
├── src/
│   └── index.tsx          # Main Hono application
├── public/
│   └── static/
│       ├── style.css      # Main website styles
│       ├── app.js         # Frontend JavaScript
│       ├── admin.css      # Admin panel styles
│       └── admin.js       # Admin panel JavaScript
├── migrations/
│   └── 0001_initial_schema.sql
├── seed.sql               # Initial data
├── wrangler.jsonc         # Cloudflare config
├── ecosystem.config.cjs   # PM2 config
└── package.json
```

## API Endpoints

### Public APIs
- `GET /api/public/data` - Get all public site data
- `POST /api/public/contact` - Submit contact form

### Admin APIs (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check` - Check session
- `GET/PUT /api/admin/settings/:key` - Manage settings
- `GET/POST/PUT/DELETE /api/admin/slides/:id` - Manage slides
- `GET/POST/PUT/DELETE /api/admin/gallery/:id` - Manage gallery
- `GET/POST/PUT/DELETE /api/admin/social/:id` - Manage social links
- `GET /api/admin/contacts` - Get enquiries
- `PUT /api/admin/change-password` - Change credentials

## Cloudflare Deployment

### 1. Create D1 Database
```bash
npx wrangler d1 create drishti-db
# Copy the database_id to wrangler.jsonc
```

### 2. Apply Migrations
```bash
npx wrangler d1 migrations apply drishti-db
```

### 3. Seed Data (Optional)
```bash
npx wrangler d1 execute drishti-db --file=./seed.sql
```

### 4. Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name drishti-digital-library
```

### 5. Set Secrets (Change Admin Password via D1 Console)
Go to Cloudflare Dashboard → D1 → drishti-db → Console and run:

```sql
-- To change password (generate SHA-256 hash of new password)
UPDATE admin_users SET password_hash = 'your-sha256-hash', username = 'newusername' WHERE id = 1;
```

## Cashfree Payment Gateway

This website includes all required legal pages for payment gateway integration:
- Terms & Conditions
- Privacy Policy
- Refund & Cancellation Policy
- About Us
- Contact Information

To integrate Cashfree:
1. Register on Cashfree
2. Submit website for review
3. Add payment integration code
4. Update Terms with payment-specific clauses

## Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Apply migrations
npm run db:migrate:local

# Seed data
npm run db:seed

# Start server
pm2 start ecosystem.config.cjs

# Or using npm script
npm run dev:sandbox
```

## Environment Variables (Cloudflare)

No environment variables needed for basic setup. The D1 database binding is configured in `wrangler.jsonc`.

## License

MIT License

---

Built with Hono + Cloudflare Pages for **Drishti Digital Library - Self Study Center**
