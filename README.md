# 💧 Water Biz Tracker

A mobile-first PWA web app for managing water business customers, orders, and payments. Supports offline mode, multi-employee tracking, Telegram alerts, and Khmer/English language toggle.

---

## 🏗️ Architecture

### Stack
| Layer | Tech |
|-------|------|
| Frontend | React + Vite (PWA) |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Offline | IndexedDB + Service Worker |
| Alerts | Telegram Bot API |
| Hosting | Vercel (frontend) + Supabase (backend/db) |

---

## 👥 Roles

| Role | Access |
|------|--------|
| **Owner** | Full access — all employees, all customers, all stats, payment overview |
| **Employee** | Own customers only — add orders, mark as paid |

---

## 📁 Folder Structure

```
water-biz-tracker/
├── frontend/                  # React + Vite PWA
│   ├── public/
│   │   └── manifest.json      # PWA manifest
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx  # Owner dashboard
│   │   │   ├── Customers.jsx  # Customer list + search
│   │   │   ├── NewOrder.jsx   # Add new order
│   │   │   └── Orders.jsx     # Order history
│   │   ├── hooks/
│   │   │   ├── useOfflineSync.js   # IndexedDB + sync logic
│   │   │   └── useLanguage.js      # KH/EN toggle
│   │   ├── i18n/
│   │   │   ├── en.js          # English strings
│   │   │   └── km.js          # Khmer strings
│   │   ├── store/             # Zustand state management
│   │   ├── lib/
│   │   │   ├── supabase.js    # Supabase client
│   │   │   └── db.js          # IndexedDB helper (offline)
│   │   └── App.jsx
│   └── vite.config.js
│
├── backend/                   # Node.js + Express API
│   ├── routes/
│   │   ├── customers.js       # CRUD customers
│   │   ├── orders.js          # CRUD orders
│   │   ├── payments.js        # Mark paid, payment history
│   │   └── stats.js           # Owner stats endpoint
│   ├── middleware/
│   │   └── auth.js            # Supabase JWT verification
│   ├── services/
│   │   └── telegram.js        # Telegram alert service
│   ├── jobs/
│   │   └── reminderJob.js     # Cron job — check unpaid orders daily
│   └── index.js
│
├── supabase/
│   └── schema.sql             # Database schema
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

### `users` (managed by Supabase Auth)
- id, email, role (owner/employee), name, telegram_chat_id

### `customers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Customer name |
| phone | text | |
| address | text | |
| created_by | uuid | FK → users.id (employee) |
| created_at | timestamp | |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| employee_id | uuid | FK → users |
| amount_owed | numeric | In KHR or USD |
| currency | text | 'KHR' or 'USD' |
| payment_method | text | 'cash' or 'aba_khqr' |
| is_paid | boolean | Default false |
| paid_at | timestamp | Null until paid |
| note | text | Optional |
| created_at | timestamp | |

---

## ✨ Features

### 1. Customer Management
- Add new customer (name, phone, address)
- Search customer by name — reuse on next order
- Customer history (all past orders)

### 2. Order Recording
- Select existing customer or create new
- Enter amount owed + currency (KHR/USD)
- Choose payment method: Cash or ABA KHQR
- Auto-fill date and assigned employee

### 3. Payment Tracking
- Employee taps "Mark as Paid" button
- Owner sees all paid/unpaid across all employees in real time

### 4. Owner Dashboard
- Total collected today / this week / this month
- Unpaid orders list (filterable by employee)
- Per-employee stats
- Per-customer order history

### 5. Telegram Alerts
- Employee gets Telegram alert when their customer is unpaid for 3+ days
- Owner gets daily summary of all unpaid orders

### 6. Offline Mode (PWA)
- Full functionality without internet
- Data saved to IndexedDB locally
- Auto-syncs to Supabase when back online
- Installable on phone home screen (no app store needed)

### 7. Language Toggle
- Switch between 🇰🇭 Khmer and 🇬🇧 English
- Preference saved to localStorage

---

## 🚀 Phases

### Phase 1 — Foundation
- [ ] Supabase project setup + schema
- [ ] Auth (login/logout, role-based)
- [ ] Customer CRUD
- [ ] Order CRUD

### Phase 2 — Core Features
- [ ] Mark as paid flow
- [ ] Owner dashboard + stats
- [ ] Search customers

### Phase 3 — PWA + Offline
- [ ] Service worker setup
- [ ] IndexedDB offline storage
- [ ] Sync logic

### Phase 4 — Telegram + Polish
- [ ] Telegram bot setup
- [ ] Alert cron job
- [ ] Khmer/English i18n
- [ ] Mobile UI polish

---

## ⚙️ Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=

# App
VITE_APP_NAME=Water Biz Tracker
```

---

## 📱 Mobile First
Designed primarily for phone use — large tap targets, simple flows, works offline in rural/low-network areas (Siem Reap, Angkor Wat surroundings).
