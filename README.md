# 🏥 MedQueue – Smart Hospital Queue Management System

[![Netlify Status](https://api.netlify.com/api/v1/badges/deploy-status)](https://app.netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e.svg)](https://supabase.com)

**MedQueue** is an enterprise-grade, modern healthcare queue management web platform designed to eliminate waiting room congestion, optimize clinical throughput, and deliver transparent patient care.

Built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Supabase PostgreSQL & Realtime**, and **Netlify Functions**, MedQueue incorporates **M/M/1 queueing theory mathematics** to calculate operational indicators ($\lambda$, $\mu$, $\rho$, $L$, $L_q$, $W$, $W_q$) and alert hospital administrators to unstable bottlenecks before they occur.

---

## 🌟 Key Features

### 1. 🏥 Patient Portal
* **Digital Appointment Booking**: Select clinical department, consulting physician, time slot, and chief symptoms.
* **Instant Walk-in Token Generation**: Automated department-coded token allocation (e.g., `CARD-101`, `PED-102`, `ORTH-103`, `GEN-104`, `EMERG-001`).
* **Interactive QR Pass Ticket**: Printable digital ticket containing verified barcode data and real-time wait countdown.
* **Live Queue Position Tracker**: Real-time indicator displaying the patient's exact position in line and estimated time until consultation.
* **Appointment & Token History**: Complete audit history with self-service cancellation.

### 2. 🩺 Doctor Consultation Desk
* **Assigned Department Station**: Live consultation bay display with assigned room numbers.
* **Next Patient Calling**: One-click dispatch with Web Audio 3-tone chimes ($C_5 \rightarrow E_5 \rightarrow G_5$) and Web Speech voice announcements (*"Attention please, Token CARD 102 proceed to Room 204"*).
* **Consultation Lifecycle Management**: Start consultation, complete consultation, skip with clinical justification, or mark patient absent.
* **Triage Priority Elevation**: Rapid fast-track escalation of acute patients to Emergency or Priority.

### 3. 👥 Staff & Triage Desk
* **Walk-in Reception Check-in**: Rapid patient intake and digital pass printing.
* **Dynamic Queue Strategy Arbitration**: Authorized staff can toggle between **FIFO** (First-In, First-Out) and **LIFO** (Last-In, First-Out) dispatching.
* **Guaranteed Priority Preemption**: Emergency ($Weight=100$) and Priority ($Weight=50$) patients strictly bypass standard queues under *both* FIFO and LIFO modes.

### 4. 📺 Real-Time TV Kiosk Display Board
* **High-Definition Kiosk Interface**: Designed for waiting area monitors and clinical department screens.
* **Pulsing "NOW SERVING" Call Card**: High-contrast, glowing display with counter/room assignment.
* **Up Next Patient Roster**: Upcoming token sequence with estimated waiting times.
* **Live Digital Ticker**: Seconds-accurate digital clock and department filter.
* **Browser Synthesizer**: Built-in Web Audio chime and Web Speech voice engine without external audio file dependencies.

### 5. 📊 Queueing Theory Analytics (M/M/1 Model)
* **Mathematical Indicators**:
  * **Arrival Rate ($\lambda$)**: Inflow of patients per hour.
  * **Service Rate ($\mu$)**: Doctor consultation capacity per hour.
  * **Traffic Intensity ($\rho = \lambda / \mu$)**: Server utilization ratio.
  * **System Idle Probability ($P_0 = 1 - \rho$)**: Likelihood that all doctors are currently available.
  * **Average Patients in System ($L = \frac{\lambda}{\mu - \lambda}$)**.
  * **Average Patients in Queue ($L_q = \frac{\lambda^2}{\mu(\mu - \lambda)} = \rho L$)**.
  * **Average Total Time in System ($W = \frac{1}{\mu - \lambda}$ hours)**.
  * **Average Waiting Time in Queue ($W_q = \frac{\lambda}{\mu(\mu - \lambda)}$ hours)**.
* **Stability Guardrails**: Automatic visual alert when $\rho \ge 1$ (unstable divergent queue) with roster re-balancing recommendations.
* **Interactive Recharts Visualizations**: Hourly arrivals vs departures, non-linear waiting curve, and department workload breakdown.

### 6. 🧪 Stochastic Simulation Sandbox
* **Synthetic Patient Generator**: Poisson arrivals with configurable $\lambda$ and $\mu$.
* **Algorithm Comparison Benchmark**: Empirical comparison between FIFO and LIFO wait-time distributions.
* **Emergency Injection Button**: Test real-time preemption during active simulation runs.
* **Complete Data Isolation**: Simulation data never pollutes clinical patient records.

### 7. 🛡️ Super Admin & Hospital Governance
* **Department Management**: Add and configure specialties, floor locations, and daily patient capacities.
* **Physician Rostering**: Assign doctors to rooms, track credentials, and manage availability.
* **Immutable Audit Trail**: Chronological event logs with user email, action, and target table.
* **Data Export**: One-click CSV and JSON export for clinical reporting.
* **Role-Based Access Control (RBAC)**: Public registration strictly limited to Patient accounts; Admin privileges are strictly governed.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Routing** | React Router DOM v7 |
| **Charts & Data Viz** | Recharts (Responsive Line & Bar Charts) |
| **QR Code Engine** | `qrcode.react` (High-fidelity vector SVG) |
| **Audio & Speech** | Web Audio API (Chime) & Web Speech Synthesis API |
| **Backend / Serverless** | Netlify Serverless Functions (Node.js & TypeScript) |
| **Database & Auth** | Supabase PostgreSQL, Row Level Security (RLS), Supabase Realtime |
| **Hosting & CI/CD** | Netlify & GitHub |

---

## 📁 Repository Structure

```text
MedQueue/
├── frontend/                       # Vite + React 19 TypeScript application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Navbar.tsx         # Responsive header & demo role switcher
│   │   │   ├── Footer.tsx         # Healthcare footer
│   │   │   ├── ProtectedRoute.tsx # RBAC route guard
│   │   │   └── QueueTicketModal.tsx # QR pass & print modal
│   │   ├── context/               # Global state providers
│   │   │   ├── AuthContext.tsx    # Authentication & user profile state
│   │   │   ├── QueueContext.tsx   # Core queue algorithms (FIFO/LIFO/Priority)
│   │   │   └── ThemeContext.tsx   # Dark / Light theme toggle
│   │   ├── lib/                   # Utility libraries
│   │   │   ├── mm1.ts             # M/M/1 Queueing theory formulas
│   │   │   ├── sound.ts           # Web Audio chime & Web Speech announcer
│   │   │   ├── mockData.ts        # Initial healthcare seed dataset
│   │   │   └── supabase.ts        # Supabase client configuration
│   │   ├── pages/                 # Route page views
│   │   │   ├── LandingPage.tsx    # Healthcare SaaS landing page
│   │   │   ├── AuthPage.tsx       # Login, restricted registration & forgot password
│   │   │   ├── PatientDashboard.tsx # Patient booking & QR pass
│   │   │   ├── DoctorDashboard.tsx # Doctor station & patient calling
│   │   │   ├── StaffDashboard.tsx # Reception check-in & strategy switch
│   │   │   ├── AdminDashboard.tsx # Hospital governance & audit logs
│   │   │   ├── DisplayBoardPage.tsx # TV kiosk real-time display
│   │   │   ├── AnalyticsPage.tsx  # M/M/1 queuing theory dashboard
│   │   │   └── SimulationPage.tsx # Stochastic simulation sandbox
│   │   ├── types/
│   │   │   └── index.ts           # Global TypeScript interfaces
│   │   ├── App.tsx                # Client routing & providers
│   │   ├── index.css              # Tailwind CSS v4 design tokens
│   │   └── main.tsx               # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                       # Server endpoints & APIs
├── netlify/
│   └── functions/
│       └── api.ts                 # Serverless REST endpoints
├── database/                      # Supabase PostgreSQL schema & seed scripts
│   ├── 01_schema.sql              # Tables, foreign keys & indexes
│   ├── 02_rls_and_triggers.sql    # Row Level Security & Realtime publication
│   └── 03_seed_data.sql           # Initial clinical departments, doctors & tokens
├── netlify.toml                   # Netlify build, redirects & security headers
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
└── package.json                   # Root workspace orchestration
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
* Node.js v18+ or v20+
* npm v9+

### 2. Clone and Install
```bash
# Navigate to the MedQueue folder
cd MedQueue

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example frontend/.env
```
*(Optional)* Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
> **Note**: MedQueue is designed with a high-fidelity reactive state engine. If Supabase credentials are not provided, it seamlessly operates with comprehensive in-memory and `localStorage` clinical data, allowing 100% functionality during evaluations and offline demonstrations!

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Setup (Supabase)

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Execute the SQL migration scripts in sequence:
   * Run [`database/01_schema.sql`](database/01_schema.sql)
   * Run [`database/02_rls_and_triggers.sql`](database/02_rls_and_triggers.sql)
   * Run [`database/03_seed_data.sql`](database/03_seed_data.sql)
   * Run [`database/04_appointment_scheduling.sql`](database/04_appointment_scheduling.sql) to enable appointment slot availability, the five-minute buffer, cancellation/rescheduling RPCs, and database-enforced concurrent booking protection.
4. Enable Supabase Auth email/password sign-in. Patient registration creates an Auth account and links its profile using `profiles.auth_id`; confirm the Auth email if email confirmation is enabled. Provision staff, doctors, and administrators as Supabase Auth users and link their profile rows before they sign in.
5. Copy your **Project URL** and **Anon Key** from `Project Settings -> API` into your Netlify / `.env` configuration.

> **Appointment booking:** With Supabase configured, sign-in requires valid Supabase Auth credentials and authenticated bookings are persisted in Supabase with a PostgreSQL exclusion constraint. The scheduling migration defaults the clinic timezone to `Asia/Kolkata`; update `medqueue_settings.clinic_timezone` to the hospital's IANA timezone before production use if the clinic is elsewhere. Without Supabase configuration, the app uses local demo profiles and appointments stored only in the current browser; these are not shared reservations and cannot prevent bookings from other devices. The seeded evaluator accounts are local demo accounts only; they are not provisioned Supabase Auth users.

---

## 🚀 Netlify Deployment Guide

1. Push this repository to **GitHub**.
2. Log in to [Netlify](https://app.netlify.com) and click **"Add new site" -> "Import an existing project"**.
3. Select your newly created `MedQueue` repository.
4. Netlify will automatically detect `netlify.toml`:
   * **Build command**: `npm --prefix frontend run build`
   * **Publish directory**: `frontend/dist`
   * **Functions directory**: `netlify/functions`
5. In **Site Configuration -> Environment variables**, add:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy Site**!

---

## 🔑 Demo Evaluator Accounts

For quick college project reviews without Supabase credentials, MedQueue features a **1-Click Role Switcher** in the navigation bar. These local demo accounts are only available in demo mode:

| Role | Email | Password | Access Highlights |
|---|---|---|---|
| **Patient** | `patient@medqueue.health` | *(any password)* | Book appointments, generate QR pass, track queue position |
| **Doctor** | `doctor.sarah@medqueue.health` | *(any password)* | Cardiology station (Room 204), call patient, audio announcement, skip |
| **Staff** | `staff@medqueue.health` | *(any password)* | Walk-in check-in, toggle FIFO/LIFO, emergency triage |
| **Admin** | `admin@medqueue.health` | *(any password)* | Hospital director overview, doctor roster, system audit logs, CSV export |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
