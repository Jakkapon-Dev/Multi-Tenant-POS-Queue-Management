# 🍽️ OmniPOS: Multi-Tenant Restaurant POS & Real-Time Kitchen Display System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101.svg?style=flat-square&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **OmniPOS** is an enterprise-grade, multi-tenant Restaurant & Cafe Management SaaS platform engineered with full-stack best practices. It features seamless QR mobile self-ordering, interactive cashier POS table floor maps, real-time Kitchen Display Systems (KDS) with WebSockets, automated raw recipe inventory deduction, and executive analytics.

---

## 🌟 Key Features & Views

| View | Target User | Description |
| :--- | :--- | :--- |
| 📱 **Customer QR Menu** | Diners / Guests | Mobile-first self-ordering, customized modifiers (sweetness, oat milk), live order tracking & status updates |
| 💻 **Cashier POS Register** | Staff / Cashiers | Interactive table floor map (Occupied/Open), bill creation, dynamic discounts, and instant payment settlement |
| 🍳 **Kitchen Display (KDS)** | Chefs / Kitchen | Real-time Kanban ticket board with live audio alerts, cooking timers, and dish-by-dish checklist bumping |
| 📊 **Owner Analytics** | Restaurant Owners | Executive BI dashboard with hourly sales velocity, top 5 dishes, and tender breakdown (PromptPay / Cash / Card) |
| 📦 **Inventory & Recipes** | Kitchen Managers | Automated recipe ingredient deduction (e.g. 1 Latte deducts 18g beans & 150ml milk), low-stock warnings, and 1-click restock |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client ["Frontend Client (React + TypeScript + TailwindCSS)"]
        DemoSwitcher["⚡ One-Click Demo Role Switcher"]
        CustomerView["📱 Customer Mobile QR Menu"]
        CashierPOS["💻 Cashier POS Table Map & Register"]
        KDS["🍳 Real-Time Kitchen Display System (KDS)"]
        Dashboard["📊 Owner Sales Analytics"]
        Inventory["📦 Inventory & Recipe Stock"]
    end

    subgraph Backend ["Backend API & Real-Time Engine (Node.js + Express)"]
        AuthMiddleware["RBAC & Tenant Isolation Middleware"]
        SocketEngine["Socket.io Real-Time Dispatcher"]
        REST_API["REST Controllers (Orders, Tables, Menu, Inventory)"]
    end

    subgraph Database ["Data & Persistence Layer"]
        Prisma["Prisma ORM"]
        DB[("Multi-Tenant SQLite / PostgreSQL")]
    end

    CustomerView <-->|WebSocket + REST| Backend
    CashierPOS <-->|WebSocket + REST| Backend
    KDS <-->|WebSocket Events| SocketEngine
    Dashboard <-->|REST API| REST_API
    Inventory <-->|REST API| REST_API
    Backend <--> Prisma <--> DB
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Project-POS.git
cd Project-POS

# 2. Install dependencies
npm install --prefix server
npm install --prefix client

# 3. Setup database and populate seed data
npm run prisma:push --prefix server
npm run seed --prefix server

# 4. Start both Backend and Frontend concurrently
npm run dev --prefix server
npm run dev --prefix client
```

Open your browser at **`http://localhost:5173`** to explore all 5 interactive roles via the top **One-Click Demo Role Switcher**.

---

## 📦 Version Progression & Roadmap

### 🟢 Version 1.0 (v0.1.0) — Core Engine & Ordering Flow
- Monorepo structure with strict `.gitignore` and security configuration.
- Prisma multi-tenant data schema (Tenant, User, Category, MenuItem, Modifiers, Tables, Orders).
- REST APIs for authentication, menu CRUD, and table floor map lookups.
- Customer mobile QR menu and Cashier POS table interface.

### 🟡 Version 2.0 (v0.2.0) — Real-Time KDS & Multi-Tenancy
- Socket.io integration for instant order synchronization across kitchen and tables.
- Real-time Kitchen Display System (KDS) with audio chimes and elapsed timers.
- RBAC and Tenant Data Isolation middleware.
- Automated unit test suite with 13/13 passing assertions.

### 🔵 Version 3.0 (v0.3.0) — Analytics, Inventory & Demo Polish
- Raw ingredient inventory tracking with automated recipe deduction on order completion.
- Owner analytics dashboard with peak-hour sales velocity and top dish rankings.
- PromptPay QR, Cash change calculator, and thermal receipt printing simulation.
- One-click recruiter demo mode toolbar.

---

## 🧪 Automated Testing

Run the built-in test suite:
```bash
npm run test --prefix server
```

---

## 🛡️ Security & GitHub Safety Guidelines

For complete guidelines on keeping GitHub repositories secure from accidental secret leaks and account flags, review [GITHUB_SAFETY_GUIDE.md](file:///d:/code/Project-POS/GITHUB_SAFETY_GUIDE.md).

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
