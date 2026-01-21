# Cloudflare Deployment Guide - Drishti Digital Library

## Step 1: Create Cloudflare Account (if not already)

Go to https://dash.cloudflare.com and sign up/login.

## Step 2: Install Wrangler and Login

```bash
# Already installed in project
npx wrangler login
```

## Step 3: Create D1 Database

```bash
npx wrangler d1 create drishti-db
```

**OUTPUT will look like:**
```
✅ Successfully created DB 'drishti-db'!
database_name = "drishti-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` and update in `wrangler.jsonc`:**
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "drishti-db",
      "database_id": "PASTE-YOUR-DATABASE-ID-HERE"
    }
  ]
}
```

## Step 4: Apply Migrations to Production Database

```bash
npx wrangler d1 migrations apply drishti-db
```

## Step 5: Seed Initial Data (Optional)

```bash
npx wrangler d1 execute drishti-db --file=./seed.sql
```

## Step 6: Create Cloudflare Pages Project

```bash
npx wrangler pages project create drishti-digital-library --production-branch main --compatibility-date 2026-01-21
```

## Step 7: Build and Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name drishti-digital-library
```

**Your website will be live at:**
- `https://drishti-digital-library.pages.dev`
- Or random subdomain like `https://abc123.drishti-digital-library.pages.dev`

## Step 8: Configure D1 Binding in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages
2. Select `drishti-digital-library` project
3. Go to Settings → Functions → D1 database bindings
4. Add binding:
   - Variable name: `DB`
   - D1 database: Select `drishti-db`

## Step 9: Change Default Admin Password

### Option A: Via Admin Panel
1. Go to `https://your-site.pages.dev/admin`
2. Login with default credentials: `admin` / `admin123`
3. Go to Security section
4. Change username and password

### Option B: Via D1 Console (Cloudflare Dashboard)
1. Go to Cloudflare Dashboard → D1
2. Select `drishti-db`
3. Go to Console tab
4. Run this SQL (replace with your new password's SHA-256 hash):

```sql
-- Generate SHA-256 hash online: https://emn178.github.io/online-tools/sha256.html
-- Example: 'mynewpassword123' → '4b0f7348cc5f7a4c5376d0f79a3e1e30d2c0d5f8b4c3a2e1f0d9c8b7a6050403'

UPDATE admin_users 
SET username = 'newadmin', 
    password_hash = 'YOUR-SHA256-HASH-HERE',
    updated_at = CURRENT_TIMESTAMP 
WHERE id = 1;
```

## Common Issues

### Issue: D1 not working in production
**Solution:** Make sure D1 binding is configured in Pages settings (Step 8).

### Issue: API returns 500 error
**Solution:** Check D1 binding name matches 'DB' in both wrangler.jsonc and Pages settings.

### Issue: Migrations not applied
**Solution:** Run `npx wrangler d1 migrations apply drishti-db` without `--local` flag.

## Useful Commands

```bash
# Check D1 status
npx wrangler d1 info drishti-db

# Query database
npx wrangler d1 execute drishti-db --command="SELECT * FROM admin_users"

# View all tables
npx wrangler d1 execute drishti-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# Delete and recreate
npx wrangler d1 delete drishti-db
npx wrangler d1 create drishti-db
```

## Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Pages → drishti-digital-library
2. Click "Custom domains"
3. Add your domain (e.g., `www.drishtilibrary.com`)
4. Follow DNS configuration steps

---

**Need Help?**
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- D1 Database Docs: https://developers.cloudflare.com/d1/
