# YAZHINI FINE JEWELS & PAWN SHOP
> **TRUST • TRADITION • TIMELESS BEAUTY**

A luxury jewelry retail and comprehensive pawn loan management platform built with modern architecture featuring separate **frontend** and **backend** modules.

---

## 📁 Project Architecture & Folder Separation

The project is structured into dedicated, decoupled directories:

```text
pawnshop/
├── frontend/                     # Dedicated Frontend Web Application
│   ├── src/                      # UI Components, Pages, State Contexts, Services
│   │   ├── components/           # Luxury UI components & Admin Modules
│   │   ├── pages/                # Home, Admin, Login, Dashboard, Pawn, LiveRates
│   │   ├── context/              # Auth, Cart, Wishlist, Rates, Theme
│   │   ├── services/             # Client-side API and database services
│   │   └── utils/                # Calculations, formatters, motion, validation
│   ├── public/                   # Images, jewellery catalog assets, logos
│   ├── index.html                # Entry HTML
│   ├── vite.config.ts            # Vite config with /api proxy to backend
│   ├── tailwind.config.js        # Theme color tokens & typography
│   ├── tsconfig.json             # Frontend TypeScript configuration
│   └── package.json              # Frontend dependencies and scripts
│
├── backend/                      # Dedicated Backend API & Database Services
│   ├── src/
│   │   ├── server.ts             # Standalone Node/Express HTTP server (port 5001)
│   │   └── routes/               # Modular route handlers
│   │       ├── metalRates.ts     # Live XAU/XAG/XPT metal benchmark rates
│   │       ├── diamond.ts        # 4Cs Rapaport diamond price estimation
│   │       └── razorpay.ts       # Razorpay order generation & payment verification
│   ├── api/                      # Serverless & internal endpoint controllers
│   ├── scripts/                  # Metal rates cron & database setup scripts
│   ├── sql/                      # Complete PostgreSQL schema migrations
│   ├── tsconfig.json             # Backend TypeScript configuration
│   └── package.json              # Backend dependencies and scripts
│
├── scripts/                      # Workspace utility scripts
├── .env                          # Shared environment configuration
├── package.json                  # Root npm workspace configuration
└── README.md
```

---

## 🚀 Running the Application

### Option A: Run Both Together (Recommended)
From the root directory:
```bash
# Starts backend API on port 5001 and frontend on port 5173
npm run dev:all
```

### Option B: Run Individually

**1. Start the Backend API (Port 5001):**
```bash
# From root:
npm run dev:backend

# Or from backend folder:
cd backend
npm run dev
```
- Health Check: `http://localhost:5001/api/health`
- Metal Rates: `http://localhost:5001/api/metal-rates`

**2. Start the Frontend (Port 5173):**
```bash
# From root:
npm run dev:frontend

# Or from frontend folder:
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`
- Admin Dashboard: `http://localhost:5173/admin` (unified sign-in via `http://localhost:5173/login`)

---

## 🧪 Testing and Production Builds

### Run Unit and Integration Tests:
```bash
# From root:
npm run test:frontend

# Or inside frontend:
cd frontend && npm test
```
*Current coverage: 11 test suites passing (107/107 tests).*

### Build Production Bundle:
```bash
# From root:
npm run build:frontend

# Or inside frontend:
cd frontend && npm run build
```


