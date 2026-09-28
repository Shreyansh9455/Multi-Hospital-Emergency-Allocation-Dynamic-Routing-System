import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHospitals, getAmbulances, getCases } from '../services/api';
import {
  subscribeToHospitalUpdates,
  subscribeToCaseUpdates,
  subscribeToAmbulanceUpdates,
} from '../services/socket.js';
import MapView from '../components/MapView';
import {
  Building2,
  Wind,
  Shield,
  Activity,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  MapPin,
  Truck,
  Radio,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [livePulse, setLivePulse] = useState(false);

  // Initial Data Fetch on mount
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [hospRes, ambRes, casesRes] = await Promise.all([
      getHospitals(),
      getAmbulances(),
      getCases(),
    ]);

    if (hospRes.success) setHospitals(hospRes.data);
    else setError(hospRes.error || 'Failed to fetch hospital records');

    if (ambRes.success) setAmbulances(ambRes.data);
    if (casesRes.success) setCases(casesRes.data);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Day 22: Real-time Socket.IO subscriptions (Replaces periodic polling)
    const unsubHospitals = subscribeToHospitalUpdates((updatedHospital) => {
      if (!updatedHospital || !updatedHospital._id) return;
      setHospitals((prev) =>
        prev.map((h) => (h._id === updatedHospital._id ? updatedHospital : h))
      );
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });

    const unsubCases = subscribeToCaseUpdates((updatedCase) => {
      if (!updatedCase || !updatedCase._id) return;
      setCases((prev) => {
        const exists = prev.some((c) => c._id === updatedCase._id);
        if (exists) {
          return prev.map((c) => (c._id === updatedCase._id ? updatedCase : c));
        }
        return [updatedCase, ...prev];
      });
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });

    const unsubAmbulances = subscribeToAmbulanceUpdates((updatedAmbulance) => {
      if (!updatedAmbulance || !updatedAmbulance._id) return;
      setAmbulances((prev) =>
        prev.map((a) => (a._id === updatedAmbulance._id ? updatedAmbulance : a))
      );
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });

    return () => {
      unsubHospitals();
      unsubCases();
      unsubAmbulances();
    };
  }, [fetchDashboardData]);

  // Aggregate stats
  const totalHospitals = hospitals.length;
  const totalAvailableBeds = hospitals.reduce((acc, h) => acc + (h.availableBeds || 0), 0);
  const totalBeds = hospitals.reduce((acc, h) => acc + (h.totalBeds || 0), 0);
  const totalAvailableIcu = hospitals.reduce((acc, h) => acc + (h.availableIcuBeds || 0), 0);
  const totalIcu = hospitals.reduce((acc, h) => acc + (h.icuBeds || 0), 0);

  const idleAmbulancesCount = ambulances.filter((a) => a.status === 'idle').length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className={`w-3 h-3 ${livePulse ? 'text-emerald-400 animate-ping' : 'text-cyan-400'}`} />
              Live Socket.IO Stream Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Building2 className="text-cyan-400 w-8 h-8" />
            Varanasi District Hospital Network & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-facility bed availability, ICU capacity telemetry, and geospatial emergency dispatch grid.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Updating...' : 'Refresh Grid'}
        </button>
      </div>

      {/* Summary KPI Bar (Day 12) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hospitals Active</div>
            <div className="text-xl font-bold font-mono text-white">
              {isLoading ? '—' : totalHospitals} <span className="text-xs font-normal text-slate-400">facilities</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Beds</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {isLoading ? '—' : totalAvailableBeds} <span className="text-xs text-slate-400 font-normal">/ {totalBeds}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available ICU</div>
            <div className="text-xl font-bold font-mono text-indigo-300">
              {isLoading ? '—' : totalAvailableIcu} <span className="text-xs text-slate-400 font-normal">/ {totalIcu}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <Truck size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Idle Ambulances</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {isLoading ? '—' : idleAmbulancesCount} <span className="text-xs text-slate-400 font-normal">/ {ambulances.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Leaflet MapView (Days 19, 20 & 22) */}
      <MapView hospitals={hospitals} ambulances={ambulances} cases={cases} />

      {/* Error State */}
      {error && (
        <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-rose-400 mx-auto" />
          <div className="text-base font-bold text-white">Unable to Load Hospital Data</div>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              <div className="space-y-2 pt-2">
                <div className="h-2 bg-slate-800 rounded" />
                <div className="h-2 bg-slate-800 rounded w-5/6" />
              </div>
              <div className="h-6 bg-slate-800/40 rounded pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Responsive Hospital Grid (Day 12, 13, 14 & 22 Live Color Coding) */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-cyan-400" />
              Varanasi Facilities & Bed Ratios ({hospitals.length} Hospitals)
            </h2>
            <span className="text-xs text-slate-400">
              Live WebSocket Sync • Click hospital to edit capacity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hospitals.map((h) => {
              const freeRatio = h.totalBeds > 0 ? h.availableBeds / h.totalBeds : 0;
              const freePercent = Math.round(freeRatio * 100);

              // Day 13 Color-Coding: Green (>40%), Yellow (15-40%), Red (<15%)
              let statusColor = 'border-l-emerald-500';
              let barColor = 'bg-emerald-500';

              if (freeRatio < 0.15) {
                statusColor = 'border-l-rose-500';
                barColor = 'bg-rose-500';
              } else if (freeRatio <= 0.40) {
                statusColor = 'border-l-amber-500';
                barColor = 'bg-amber-500';
              }

              const isCriticalO2 = h.oxygenStatus === 'critical';
              const isLowO2 = h.oxygenStatus === 'low';

              return (
                <div
                  key={h._id}
                  onClick={() => navigate(`/hospital/${h._id}`)}
                  className={`bg-slate-900/90 p-5 space-y-4 border border-slate-800 border-l-[5px] ${statusColor} hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group`}
                >
                  {/* Header info */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {h.name}
                      </h3>
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-amber-400 flex-shrink-0" />
                      <span>{h.locality}, {h.district}</span>
                    </p>
                  </div>

                  {/* Ayushman Empanelled Badge (Day 13) */}
                  {h.ayushmanEmpanelled && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start">
                      <Shield size={11} /> Ayushman PM-JAY
                    </div>
                  )}

                  {/* General Beds Capacity Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">General Beds</span>
                      <span className="font-mono font-bold text-white">
                        {h.availableBeds} / {h.totalBeds} <span className="text-[11px] text-slate-400">({freePercent}% free)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(0, freePercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* ICU Beds Metric */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">ICU Beds</span>
                      <span className="font-mono font-bold text-indigo-300">
                        {h.availableIcuBeds} / {h.icuBeds}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{
                          width: `${h.icuBeds > 0 ? (h.availableIcuBeds / h.icuBeds) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Badges: Oxygen Status & Ventilators */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                          isCriticalO2
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : isLowO2
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Wind size={10} /> O₂ {h.oxygenStatus}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300">
                      💨 Vents: <strong className="text-white">{h.ventilatorsAvailable}</strong>/{h.ventilators}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
