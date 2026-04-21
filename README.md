# InstaDM v3 — Instagram DM Automation (MySQL Edition)

Full-stack Instagram DM automation with **Google OAuth**, **real Instagram Business API**, **MySQL** storage, and a 4-step setup wizard.

---

## 📋 MySQL Database Schema

Tables auto-created on first `npm run dev`:

| Table | Purpose |
|---|---|
| `users` | Stores Google-authenticated users (id, google_id, email, name, avatar) |
| `instagram_accounts` | Full IG profile per user (username, bio, followers, token, page_id…) |
| `dm_rules` | Keyword → auto-reply DM rules per user |
| `comment_rules` | Comment keyword → auto-DM rules per user |
| `sessions` | Express sessions stored in MySQL |

---

## 🚀 Quick Start

### 1. Create MySQL database

```sql
CREATE DATABASE instadm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### 4. Run

```bash
# Terminal 1
cd backend  && npm run dev    # → http://localhost:5000

# Terminal 2
cd frontend && npm start      # → http://localhost:3000
```

Tables are created automatically on startup — no migration scripts needed.

---

## 🔑 Credentials Guide

### MySQL (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=instadm
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### Google OAuth
1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
2. Authorized redirect URI: `http://localhost:5000/auth/google/callback`
3. Copy Client ID + Secret to `.env`

### Meta / Instagram App
1. [developers.facebook.com](https://developers.facebook.com) → Create App → Business
2. Add: **Facebook Login** + **Instagram Graph API**
3. Facebook Login → Valid OAuth Redirect: `http://localhost:5000/instagram/callback`
4. Required permissions: `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `pages_show_list`, `pages_read_engagement`
5. Copy App ID + Secret to `.env`

### Webhook (for live DM/comment events)
```bash
ngrok http 5000
# Use the https URL
```
Meta Developer → Webhooks:
- Callback URL: `https://your-ngrok-url/webhook`
- Verify Token: same as `INSTAGRAM_VERIFY_TOKEN` in `.env`
- Subscribe to fields: `messages`, `comments`

---

## 🔄 User Flow

```
Click "AutoDM" button
  └─ Not logged in? → /login → Google OAuth → saved to MySQL users table
  └─ Logged in, no IG? → /connect-instagram wizard
       Step 1: Connect Instagram → Meta OAuth → full profile saved to instagram_accounts
       Step 2: Enter trigger keyword
       Step 3: Write automated reply
       Step 4: ✅ Rule saved → automation live
```

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/auth/google` | — | Start Google login |
| GET | `/auth/me` | — | Current user + IG account |
| POST | `/auth/logout` | ✓ | Logout + clear session |
| GET | `/instagram/connect` | ✓ | Start Instagram OAuth |
| GET | `/instagram/callback` | — | Instagram OAuth callback |
| GET | `/instagram/account` | ✓ | Get connected IG account |
| DELETE | `/instagram/account` | ✓ | Disconnect IG account |
| GET/POST/PUT/DELETE | `/api/automation/dm-rules` | ✓ | CRUD DM keyword rules |
| GET/POST/PUT/DELETE | `/api/automation/comment-rules` | ✓ | CRUD comment rules |
| GET/POST | `/webhook` | — | Meta webhook |
