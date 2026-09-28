import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Truck, Activity, Wind, MapPin, User, Shield } from 'lucide-react';

/**
 * Creates custom HTML Leaflet Marker Icons with modern glow and status colors
 */
function createHospitalIcon(freeRatio) {
  let color = '#00e599'; // Green > 40%
  let bg = 'rgba(0, 229, 153, 0.25)';
  if (freeRatio < 0.15) {
    color = '#ff3366'; // Red < 15%
    bg = 'rgba(255, 51, 102, 0.25)';
  } else if (freeRatio <= 0.40) {
    color = '#ffb703'; // Yellow 15-40%
    bg = 'rgba(255, 183, 3, 0.25)';
  }

  const html = `
    <div style="
      width: 32px;
      height: 32px;
      background: #0d1322;
      border: 2px solid ${color};
      box-shadow: 0 0 14px ${color}80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${color};
      font-size: 14px;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      🏥
    </div>
  `;

  return L.divIcon({
    className: 'custom-hospital-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createAmbulanceIcon(status) {
  let color = '#00e599'; // Idle (green)
  if (status === 'enroute') color = '#00d2ff'; // Enroute (cyan)
  if (status === 'busy') color = '#ff3366'; // Busy (red)

  const html = `
    <div style="
      width: 30px;
      height: 30px;
      background: #0d1322;
      border: 2px solid ${color};
      box-shadow: 0 0 12px ${color}90;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${color};
      font-size: 13px;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      🚑
    </div>
  `;

  return L.divIcon({
    className: 'custom-ambulance-marker',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function MapView({ hospitals = [], ambulances = [], cases = [] }) {
  // Centered on Varanasi
  const varanasiCenter = [25.3176, 82.9739];

  // Active Dispatches (for Day 20 Polylines)
  const activeDispatches = cases.filter(
    (c) => c.status === 'dispatched' && c.assignedAmbulance && c.assignedHospital
  );

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-3 border border-white/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <MapPin size={17} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Varanasi Healthcare Grid & Live Telemetry Map (Day 19 & 20)
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive geospatial visualization of district hospitals, GPS ambulance fleet, and active dispatch routes.
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[440px] rounded-xl overflow-hidden border border-white/10 relative">
        <MapContainer
          center={varanasiCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#0a0f1d' }}
        >
          {/* CartoDB Dark Matter Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Hospital Markers */}
          {hospitals.map((h) => {
            const freeRatio = h.totalBeds > 0 ? h.availableBeds / h.totalBeds : 0;
            const freePercent = Math.round(freeRatio * 100);

            return (
              <Marker
                key={h._id}
                position={[h.lat, h.lng]}
                icon={createHospitalIcon(freeRatio)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-1.5 text-slate-900 min-w-[200px]">
                    <div className="font-extrabold text-sm text-slate-900 border-b pb-1">
                      {h.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      📍 {h.locality}, {h.district}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      🛏️ Beds: <strong>{h.availableBeds}</strong> / {h.totalBeds} ({freePercent}% free)
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      🩺 ICU: <strong>{h.availableIcuBeds}</strong> / {h.icuBeds}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      💨 Vents: <strong>{h.ventilatorsAvailable}</strong> / {h.ventilators}
                    </div>
                    <div className="text-xs uppercase font-bold text-cyan-700">
                      O₂ Status: {h.oxygenStatus}
                    </div>
                    {h.ayushmanEmpanelled && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        🛡️ Ayushman Empanelled
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Ambulance Markers */}
          {ambulances.map((amb) => (
            <Marker
              key={amb._id}
              position={[amb.currentLocation.lat, amb.currentLocation.lng]}
              icon={createAmbulanceIcon(amb.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-1.5 text-slate-900 min-w-[190px]">
                  <div className="font-bold text-sm text-slate-900 border-b pb-1">
                    🚑 {amb.vehicleId}
                  </div>
                  <div className="text-xs text-slate-700">
                    Driver: <strong>{amb.driverName}</strong>
                  </div>
                  <div className="text-xs uppercase font-bold text-indigo-700">
                    Status: {amb.status}
                  </div>
                  {amb.assignedCase && (
                    <div className="text-[11px] bg-cyan-100 text-cyan-900 p-1 rounded font-medium">
                      🚨 Enroute to Patient: {amb.assignedCase.patientName || 'Assigned'}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Day 20: Polylines for Active Dispatches */}
          {activeDispatches.map((dispatch) => {
            const ambLocation = dispatch.assignedAmbulance.currentLocation;
            const patientLocation = dispatch.location;
            const hospitalLocation = {
              lat: dispatch.assignedHospital.lat,
              lng: dispatch.assignedHospital.lng,
            };

            if (!ambLocation || !patientLocation || !hospitalLocation.lat) return null;

            const positions = [
              [ambLocation.lat, ambLocation.lng],
              [patientLocation.lat, patientLocation.lng],
              [hospitalLocation.lat, hospitalLocation.lng],
            ];

            return (
              <Polyline
                key={`poly-${dispatch._id}`}
                positions={positions}
                color="#00d2ff"
                weight={3.5}
                opacity={0.85}
                dashArray="6, 8"
              />
            );
          })}
        </MapContainer>

        {/* Day 20: Floating Legend Overlay */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 rounded-xl text-[11px] text-slate-300 space-y-1.5 shadow-2xl">
          <div className="font-bold text-white uppercase text-[10px] tracking-wider border-b border-white/10 pb-1">
            Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Hospital (&gt;40% Beds Free)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Hospital (15–40% Beds Free)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Hospital (&lt;15% Beds Free)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🚑</span>
            <span>Ambulance (Idle / Enroute / Busy)</span>
          </div>
          {activeDispatches.length > 0 && (
            <div className="flex items-center gap-2 text-cyan-400 font-semibold border-t border-white/10 pt-1">
              <span className="font-mono">---</span>
              <span>Active Dispatch Route ({activeDispatches.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
