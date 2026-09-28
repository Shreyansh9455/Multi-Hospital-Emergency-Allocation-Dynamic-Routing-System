# 🚑 MED-DISPATCH — Backend API & Real-time Engine

Backend service for the **Multi-Hospital Emergency Allocation & Dynamic Routing System** powered by Express.js, MongoDB (Mongoose), and Socket.IO.

## 🚀 Key Modules & Architecture

- **`server.js`**: Express application setup, HTTP & Socket.IO server initialization, CORS, global error handling.
- **`config/db.js`**: Robust MongoDB connection management.
- **`controllers/`**:
  - `authController.js`: JWT-based user authentication, password hashing, and role retrieval (`districtAdmin`, `hospitalStaff`, `ambulanceDriver`).
  - `hospitalController.js`: Live bed capacity tracking, ICU inventory, and oxygen status updates.
  - `caseController.js`: Emergency intake registration, automated clinical triage calculation, and optimal hospital allocation.
  - `ambulanceController.js`: Fleet status updates, GPS telemetry, and admission handover.
  - `analyticsController.js`: MongoDB aggregations comparing FIFO vs Priority dispatch metrics.
- **`services/`**:
  - `triageService.js`: Clinical triage scoring engine (1–10 scale) factoring in life-threatening symptoms and pediatric/geriatric adjustments.
  - `dispatchService.js`: Multi-criteria priority dispatch engine combining Haversine distance, hospital occupancy rate, and oxygen cylinder status.
- **`routes/`**: Clean RESTful routes with role-based JWT middleware protection.
- **`seed.js`**: Automated seeding script with 10 Varanasi hospitals, 5 ambulances, and 3 role-based user accounts.
- **`testApi.js`**: Automated end-to-end API test suite validating auth, triage, and dispatch flows.

## 🛠 Local Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Seed database
npm run seed

# Run automated test suite
npm run test:api

# Start development server with live reload
npm run dev
```
