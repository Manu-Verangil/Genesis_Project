# Smart Campus Hub 🎓

> **One platform for the campus canteen, navigation, lost belongings, and campus issues.**
> Built strictly in accordance with `Smart_Campus_Hub_Combined.pptx`.

---

## 📌 Problem & Solution Overview

| Traditional Campus Friction (Today) | With Smart Campus Hub |
| :--- | :--- |
| **Unknown Stock**: Students walk to canteen without knowing availability. Items run out with no notice. | **Live Menu & Stock Counter**: Real-time in stock / out of stock status with exact quantity left. |
| **Long Queues**: Cash and counter delays during rush hours between classes. | **Prepaid Orders & Tokens**: Single-use digital token & QR pass with instant wallet deduction. |
| **Unpredictable Wait Times**: No visibility into kitchen preparation. | **Live ETA Prediction**: Real-time queue tracker (`~8 min, 4 orders ahead`) adjusted for rush hours. |
| **No Campus Guide**: Stores, canteens, and xerox shops are hard to locate for new students. | **Interactive Campus Map**: Visual campus blueprint with clickable store pins, timings, and walking directions. |
| **Lost Belongings**: Notices get buried in WhatsApp groups and notice boards. | **Centralized Lost & Found**: Verified portal to report, search, claim, and authenticate ownership. |
| **Unheard Issues**: No transparent way to report broken coolers, lights, or Wi-Fi. | **5-Stage Issue Resolution**: Report ➔ Route ➔ Act ➔ Notify ➔ Resolve with live timeline audit. |

---

## 🚀 Key Features by Slide

### 1. Live Canteen Menu & Stock (Slide 4 & 7)
- **Canteen 1 (Main Food Court)** and **Canteen 2 (North Campus Quick Bites)**.
- Live quantities left on dishes (e.g. `14 portions left`, `Only 3 left!`, or `Out of stock`).
- **"Notify Me" Alert**: Students can subscribe to out-of-stock items and receive real-time push alerts the moment staff restocks them.
- Real-time **Crowd Levels** (`Low`, `Moderate`, `Busy`, `Rush Hour`) with average wait estimates.

### 2. Prepaid Orders & Single-Use Pickup Tokens (Slide 4, 7 & 8)
- **Prepaid Checkout**: Campus Wallet simulation with top-up and test UPI integration.
- **Stock Reservation**: Quantities drop instantly upon payment to prevent double-ordering.
- **Unique Single-Use Token**: Sequential alphanumeric token (e.g. `C1-043`, `C1-047`) and encrypted QR code that prevents queue-jumping.
- **Auto-Refund**: Instant refund to campus wallet if an item runs out.

### 3. Live Token Queue & Wait-Time Engine (Slide 8)
- Exact realization of Slide 8:
  - **SERVING**: `C1-043`
  - **READY**: `C1-044`
  - **COOKING**: `C1-045`, `C1-046`
  - **YOU**: `C1-047` (~8 min estimated wait, 4 orders ahead)
- **Dynamic Prediction Formula**:
  $$\text{Wait Time} = \left(\sum \text{Prep Times Ahead} \times \text{Staff Speed Factor}\right) \times \text{Rush-Hour Factor}$$
- Recalculates dynamically whenever staff advances an order. Automatic alerts at "2 orders away".

### 4. Interactive Campus Map & Stores (Slide 4 & 10)
- Interactive visual blueprint of campus zones (Central, North, West, East, South).
- Pins for Canteen 1 & 2, Campus Xerox & Print Hub, University Bookstore, Central Library, Health Center, and Sports Arena.
- Detailed drawer with opening hours, peak crowd times, contact info, and one-click menu ordering.

### 5. Lost & Found Recovery Registry (Slide 4 & 10)
- Categorized lost and found listings with high-resolution photos and location stamps.
- **Ownership Verification Workflow**: Students can submit proof (identifying marks, serials, purchase invoices) for admin review and approval.

### 6. Campus Issue Reporting — 5-Stage Lifecycle (Slide 5)
1. **Report**: Choose category (Water Cooler, WiFi, Classroom AV, Sanitation), describe problem, mark location.
2. **Route**: Reaches responsible staff/admin with automatic departmental tagging.
3. **Act**: Staff update status as maintenance progresses on-site.
4. **Notify**: Student is automatically alerted on every state change.
5. **Resolve**: Issue closed and permanently recorded in maintenance history.

### 7. Voice Guidance Extension (Slide 4, 9 & 10)
- Hands-free voice assistant powered by Web Speech API.
- Recognizes commands such as *"Show menu"*, *"How busy is Canteen 1"*, *"Check my token"*, *"Where is the library"*, or *"Report an issue"*, and speaks back audible guidance.

### 8. Three Role Interfaces (Slide 6)
- **Student App**: Mobile-friendly PWA experience for ordering, maps, lost items, and issues.
- **Staff Panel**: Kitchen queue Kanban, single-use token verification scanner, quick stock counters, crowd toggles.
- **Admin Panel**: Central analytics dashboard, menu editor, map manager, claim approval, and issue dispatch.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti, Web Speech API.
- **Backend**: Node.js, Express, RESTful APIs, CORS, dynamic wait-time estimation engine.
- **Data Store**: In-memory store initialized with realistic seed data matching the presentation.
- **Dev Tools**: Vite 8, Concurrently.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended; v26 tested)
- npm

### Installation & Run

1. Clone or open the repository:
   ```bash
   git clone https://github.com/Manu-Verangil/Genesis_Project.git
   cd Genesis_Project
   ```

2. Install root and client dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. Start both Backend Server and Frontend Client concurrently:
   ```bash
   npm run dev
   ```

4. Open your browser:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/api/canteens](http://localhost:5000/api/canteens)

---

## 📸 Role Demonstrations in App

Use the **Role Switcher** in the top-right header to test all 3 personas:
- **🎓 Student View**: Browse live menus, add items to cart, pay with wallet, view the live token queue & ETA, explore the campus map, and report issues.
- **👨‍🍳 Staff View**: Manage the kitchen queue, advance orders (`Cooking` ➔ `Ready` ➔ `Serving`), verify pickup tokens using the single-use token scanner, and adjust stock.
- **🛡️ Admin View**: View revenue & order analytics, review lost-and-found claims, advance issue lifecycle stages, and add new dishes.
