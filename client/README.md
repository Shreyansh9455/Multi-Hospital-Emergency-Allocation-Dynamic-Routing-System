# 🖥 MED-DISPATCH — Frontend Dashboard & Real-Time Client

High-performance, modern React 19 application built with Vite, Tailwind CSS, Leaflet Maps, and Socket.IO client.

## 🌟 Key Features

- **Live Bed Grid & Capacity Monitor**: Visual status indicators for General and ICU beds across all district hospitals with real-time updates without page reload.
- **Interactive Leaflet Healthcare Map**: Custom dark-themed map centered on Varanasi with pulsating GPS markers, hospital status popups, and dynamic dispatch route polylines.
- **Emergency Intake & Automated Triage**: Multi-step clinical triage intake form with instant rule-based severity scoring and recommended destination hospitals.
- **Live Fleet Telemetry & Enroute Tracking**: Real-time tracking of ambulance dispatch lifecycle (`idle` ➔ `enroute` ➔ `arrived`), speed/ETA heuristics, and patient admission handover.
- **Interactive Analytics & Aggregations**: Recharts visual dashboard comparing FIFO vs Multi-Criteria Priority dispatch efficiency and hospital load balancing.
- **Role-Based Dynamic Navigation**: Tailored navigation and protected actions for District Admins, Hospital Staff, and Ambulance Drivers.

## 🛠 Local Setup

```bash
# Install dependencies
npm install

# Configure environment (optional, defaults to http://localhost:5000)
cp .env.example .env

# Start development server with Vite HMR
npm run dev

# Build production bundle
npm run build
```
