# 🛡️ License Management Dashboard — NextStep IT

A **production-ready MERN stack** application for managing IT equipment licenses with **MFA authentication**, **role-based access**, **automated notifications**, and **export capabilities**.

---

## 📐 Architecture

```
cloud PFE/
├── backend/                  # Node.js / Express API
│   ├── app.js                # Entry point
│   ├── models/               # Mongoose models (User, Equipment, License)
│   ├── routes/               # API routes
│   ├── middleware/           # JWT auth, Admin role guard
│   ├── cron/                 # Daily license expiry notification
│   └── utils/                # Email (Nodemailer)
├── frontend/                 # React 18 + Vite + Tailwind
│   └── src/
│       ├── components/       # Dashboard, Login, CRUD panels
│       ├── store/            # Redux Toolkit slices
│       └── lib/              # Axios instance
├── docker-compose.yml
├── nginx.conf
├── ecosystem.config.js       # PM2
├── swagger.js
└── .env.example
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB 6+
- (Optional) Postfix SMTP for email notifications

### 2. Configure Environment

```bash
cp .env.example backend/.env
# Edit backend/.env with your values
```

### 3. Install & Run (Development)

**Backend:**
```bash
cd backend
npm install
npm run dev   # http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 4. Seed First Admin User

```bash
curl -X POST http://localhost:5000/api/auth/register-seed \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nextstep-it.com","password":"AdminPass123"}'
```

> ⚠️ This only works if **no users exist yet**. Save the returned `mfaQr` or `mfaSecret`.

---

## 🔐 Authentication Flow

```
1. POST /api/auth/login        → { email, password } → { userId }
2. POST /api/auth/verify-mfa   → { userId, token }   → { JWT, user }
```

- **MFA**: TOTP via Google Authenticator / Authy (Speakeasy)
- **JWT**: 8-hour tokens, stored in localStorage

---

## 🧑‍💼 Role-Based Access

| Feature | User | Admin |
|---|---|---|
| Search equipment/license | ✅ | ✅ |
| Add/Edit equipment/license | ✅ | ✅ |
| Delete equipment/license | ❌ | ✅ |
| Users CRUD tab | ❌ | ✅ |
| Register new users | ❌ | ✅ |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register-seed` | Public | Seed first admin |
| POST | `/auth/login` | Public | Credentials check |
| POST | `/auth/verify-mfa` | Public | TOTP → JWT |
| GET | `/auth/me` | JWT | Current user |
| GET/POST/PUT/DELETE | `/users` | JWT+Admin | User management |
| GET/POST/PUT/DELETE | `/equipments` | JWT | Equipment CRUD |
| GET/POST/PUT/DELETE | `/licenses` | JWT | License CRUD |
| GET | `/search/equip/:serviceTag` | JWT | Find equipment |
| GET | `/search/license/:type` | JWT | Find licenses |
| GET | `/search/global?q=` | JWT | Global search |
| POST | `/export/send-pdf` | JWT | Email PDF |

**Swagger UI**: `http://localhost:5000/api/docs`

---

## 🐳 Docker Deployment

```bash
# Copy and configure env
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

---

## 🖥️ PM2 Production

```bash
cd backend
npm install --production

cd ..
npm install pm2 -g
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## ⏰ Automated Notifications

The cron job runs **daily at 08:00** and:
1. Finds licenses expiring in ≤ 30 days
2. Sends HTML email report to `NOTIFICATION_EMAIL`
3. Updates expired licenses status

Requires Postfix or SMTP configured in `.env`.

---

## 📤 Export Features

- **PDF**: jsPDF + autoTable with color-coded expiry dates
- **Excel**: xlsx library
- **Email**: PDF attachment via Nodemailer to any address

---

## 🛡️ Security Features

- Helmet.js (security headers)
- Rate limiting (200 req/15min)
- Joi validation on all inputs
- bcrypt password hashing (salt 12)
- JWT with configurable expiry
- Admin role enforcement middleware
- Self-deletion prevention for admins

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT, Speakeasy TOTP, bcryptjs |
| Email | Nodemailer + Postfix |
| Frontend | React 18, Vite, Tailwind CSS |
| State | Redux Toolkit |
| Forms | React Hook Form |
| Export | jsPDF, xlsx |
| Deploy | Docker, Nginx, PM2 |

---

*© 2024 NextStep IT — License Management Dashboard*
