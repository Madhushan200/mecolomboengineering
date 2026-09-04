# 🏨 ME Colombo — Hotel Engineering & Maintenance Reporting Portal

An enterprise-grade, real-time Engineering Dispatch & Defect Reporting System designed specifically for **ME Colombo Hotel** operations. Enables instant defect logging across Front Office, Housekeeping, and F&B, automated AI priority triaging (P1–P4), real-time audible alarms for engineering duty dispatch, technician tracking, and executive PDF/Excel reporting.

---

## ✨ Features & Capabilities

- 🚨 **Real-Time Audible Chime & Emergency Alerts**: Continuous sound alert for unacknowledged P1/P2 tickets on the Engineering Dashboard with 1-click acknowledge & mute toggle.
- 📱 **Native Android Mobile App (Capacitor)**: Full Android APK build with high-priority lock-screen notifications and vibration alerts even when display is off.
- 🔄 **Dual-Engine Real-Time Cloud Sync**: Seamless real-time sync between Desktop Web Browsers and Mobile Android APKs powered by Supabase PostgreSQL WebSockets and 3-second background polling.
- 🏢 **Role-Based Access Control (RBAC)**:
  - **Staff / Executive Portal (`/executive`)**: 1-tap defect reporting, room selection, and live 5-stage progress tracking.
  - **Engineering Command Center (`/engineering`)**: Kanban triaging, instant technician dispatch, pause/waiting timers, and resolution notes.
  - **Management & Admin Console (`/admin`)**: Hotel settings, user rosters, department controls, and day-wise/monthly Excel & PDF report exports.
- 📊 **Executive Reports & Analytics Center**: Filter maintenance history by Single Day, Date Range, or Month. Export professionally formatted **Excel (`.xlsx`)** spreadsheets and print-ready **PDF reports**.
- 🧠 **Priority Rule Engine**: Automated categorization of issues into P1 (Emergency), P2 (High), P3 (Normal), and P4 (Planned).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **Mobile Runtime** | [Capacitor 8](https://capacitorjs.com/) (Native Android SDK) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **UI & Styling** | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Database & Realtime**| [Supabase](https://supabase.com/) (PostgreSQL with Realtime Replication) |
| **Exporting** | [ExcelJS](https://github.com/exceljs/exceljs), [jsPDF](https://github.com/parallax/jsPDF) |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://fdpemolavetvusapcuek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4o7htNVJGMhJM5CKqmcW_w_Axkngprq
```

### 3. Run Web Server Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Android APK Compilation

To build the Android APK:

1. Compile static bundle & sync assets:
```bash
npm run build
npx cap sync android
```

2. Open in **Android Studio**:
```bash
npx cap open android
```
3. In Android Studio, select **Build** $\to$ **Build Bundle(s) / APK(s)** $\to$ **Build APK(s)**.
4. Output APK location:
📁 `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔐 Default Demo Logins

| Username | Password | Role | Access Portal |
| :--- | :--- | :--- | :--- |
| `mecolomboadmin` | `mecolombo` | Admin / GM | Full Access & Admin Console (`/admin`) |
| `chiefeng` | `chiefeng123` | Engineering Chief | Engineering Dashboard (`/engineering`) |
| `supervisor` | `supervisor123`| Duty Supervisor | Engineering Dashboard (`/engineering`) |
| `kasun` | `kasun123` | Senior Technician | Engineering Dashboard (`/engineering`) |
| `frontoffice` | `frontoffice123`| Staff / Front Desk | Staff Portal (`/executive`) |
| `housekeeping` | `housekeeping123`| Staff / HK | Staff Portal (`/executive`) |
| `fbservice` | `fbservice123` | Staff / F&B | Staff Portal (`/executive`) |

---

## 📄 License
Property of **ME Colombo Hotel**. All rights reserved.
