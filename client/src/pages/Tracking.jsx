import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
  Truck,
  Building2,
  RefreshCw,
  ArrowUpDown,
  User,
  AlertCircle,
  Activity,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { getCases, getAmbulances, updateAmbulanceStatus } from '../services/api';
import { subscribeToCaseUpdates, subscribeToAmbulanceUpdates } from '../services/socket.js';
import { useAuth } from '../context/AuthContext';

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Tracking() {
  const navigate = useNavigate();
  const { isDistrictAdmin, isAmbulanceDriver, isAuthenticated, user } = useAuth();

  const [cases, setCases] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'waiting' | 'dispatched' | 'admitted'
  const [sortBy, setSortBy] = useState('severity'); // 'severity' | 'time'
  const [loading, setLoading] = useState(true);
  const [arrivingId, setArrivingId] = useState(null);
  const [livePulse, setLivePulse] = useState(false);

  const fetchData = useCallback(async () => {
    const [caseRes, ambRes] = await Promise.all([
      getCases(activeTab !== 'all' ? { status: activeTab } : {}),
      getAmbulances(),
    ]);

    if (caseRes.success) setCases(caseRes.data);
    if (ambRes.success) setAmbulances(ambRes.data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchData();

    // Day 22: Replace periodic polling with live Socket.IO events
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
      unsubCases();
      unsubAmbulances();
    };
  }, [fetchData]);

  // Handle Mark Arrived (Day 18 & 26: Restricted to Driver or Admin)
  const canMarkArrived = isDistrictAdmin || isAmbulanceDriver;

  const handleMarkArrived = async (ambulanceId, caseId) => {
    if (!canMarkArrived) {
      alert('Only registered Ambulance Drivers or District Admins can complete patient admission handovers.');
      return;
    }

    setArrivingId(caseId);

    // Optimistic UI update
    setCases((prev) =>
      prev.map((c) => (c._id === caseId ? { ...c, status: 'admitted' } : c))
    );

    const res = await updateAmbulanceStatus(ambulanceId, 'arrived');
    setArrivingId(null);

    if (res.success) {
      fetchData();
    } else {
      alert(`Failed to update arrival: ${res.error}`);
      fetchData();
    }
  };

  // Sort Cases
  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === 'severity') {
      const scoreA = a.severityScore || 0;
      const scoreB = b.severityScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getSeverityPill = (score) => {
    if (!score) return <span className="text-slate-500 text-xs">Untriaged</span>;
    if (score >= 8) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          Score {score} / 10 (Critical)
        </span>
      );
    }
    if (score >= 5) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Score {score} / 10 (Urgent)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        Score {score} / 10 (Low)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className={`w-3 h-3 ${livePulse ? 'text-emerald-400 animate-ping' : 'text-emerald-400'}`} />
              Live Telemetry Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Radio size={28} className="text-emerald-400 animate-pulse" />
            Emergency Case Dispatch & Fleet Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time live monitoring of emergency intakes, hospital allocations, ambulance enroute progress, and admission handovers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Sync Live Data'}
          </button>
        </div>
      </div>

      {/* Ambulances Fleet Summary Section (Day 18) */}
      <div className="bg-slate-900/80 p-5 space-y-3 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck size={17} className="text-cyan-400" />
            Active Ambulance Fleet Overview ({ambulances.length} Vehicles)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {ambulances.filter((a) => a.status === 'idle').length} Idle • {ambulances.filter((a) => a.status === 'enroute').length} Enroute • {ambulances.filter((a) => a.status === 'busy').length} Busy
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ambulances.map((amb) => {
            const isIdle = amb.status === 'idle';
            const isEnroute = amb.status === 'enroute';
            const isBusy = amb.status === 'busy';

            return (
              <div
                key={amb._id}
                className={`p-3 rounded-2xl border transition-all ${
                  isEnroute
                    ? 'bg-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : isBusy
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white font-mono">{amb.vehicleId}</span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                      isIdle
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isEnroute
                        ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {amb.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-1">Driver: {amb.driverName}</div>
                {amb.assignedCase && (
                  <div className="text-[10px] text-cyan-300 font-semibold truncate mt-0.5">
                    🚨 Patient: {amb.assignedCase.patientName || 'Assigned'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Cases Tracker Section (Day 17, 18 & 22) */}
      <div className="space-y-4">
        {/* Filters & Sort Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'waiting', label: 'Waiting Triage' },
              { id: 'dispatched', label: 'Dispatched Enroute' },
              { id: 'admitted', label: 'Admitted' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
            <ArrowUpDown size={13} />
            <span>Sort by:</span>
            <button
              onClick={() => setSortBy('severity')}
              className={`font-semibold transition-colors cursor-pointer ${sortBy === 'severity' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Severity Score
            </button>
            <span>•</span>
            <button
              onClick={() => setSortBy('time')}
              className={`font-semibold transition-colors cursor-pointer ${sortBy === 'time' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Latest First
            </button>
          </div>
        </div>

        {/* Case Cards List */}
        {sortedCases.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Activity size={36} className="text-slate-600 mx-auto" />
            <div className="text-base font-bold text-white">No active cases in this view</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No emergency cases found matching status "{activeTab}". You can create emergency intake cases to test the dispatch pipeline.
            </p>
            <button
              onClick={() => navigate('/new-case')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-md shadow-cyan-500/20"
            >
              + Create Emergency Intake
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCases.map((c) => {
              const isWaiting = c.status === 'waiting';
              const isDispatched = c.status === 'dispatched';
              const isAdmitted = c.status === 'admitted';

              return (
                <div
                  key={c._id}
                  className={`p-5 space-y-3 border rounded-2xl transition-all ${
                    isDispatched
                      ? 'border-cyan-500/40 bg-cyan-950/15 shadow-lg shadow-cyan-500/5'
                      : isWaiting
                      ? 'border-amber-500/30 bg-amber-950/15'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Patient & Triage Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{c.patientName}</span>
                        <span className="text-xs text-slate-400">({c.age} yrs)</span>
                      </div>

                      {getSeverityPill(c.severityScore)}

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          isWaiting
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isDispatched
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <Clock size={12} className="text-slate-500" />
                      <span>{formatRelativeTime(c.createdAt)}</span>
                    </div>
                  </div>

                  {/* Symptoms Tags */}
                  {c.symptomTags && c.symptomTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.symptomTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dispatch Telemetry: Hospital & Ambulance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                    {/* Assigned Hospital */}
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building2 size={14} className="text-cyan-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400">Hospital: </span>
                        {c.assignedHospital ? (
                          <strong className="text-white">
                            {c.assignedHospital.name || c.assignedHospital} ({c.assignedHospital.locality || 'Varanasi'})
                          </strong>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Ambulance & Live ETA */}
                    <div className="flex items-center gap-2 text-slate-300">
                      <Truck size={14} className="text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400">Ambulance: </span>
                        {c.assignedAmbulance ? (
                          <strong className="text-white">
                            {c.assignedAmbulance.vehicleId || c.assignedAmbulance} ({c.assignedAmbulance.driverName || 'Paramedic'})
                          </strong>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                        {c.etaMinutes && isDispatched && (
                          <span className="ml-2 text-emerald-400 font-bold font-mono">
                            ETA ~{c.etaMinutes} mins
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mark Arrived Action Button (Day 18 & 26: Role restricted) */}
                  {isDispatched && c.assignedAmbulance && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 italic">
                        {canMarkArrived
                          ? 'Click below upon vehicle arrival at emergency ward:'
                          : 'Patient admission handover requires Ambulance Driver or Admin role.'}
                      </span>

                      <button
                        onClick={() =>
                          handleMarkArrived(
                            c.assignedAmbulance._id || c.assignedAmbulance,
                            c._id
                          )
                        }
                        disabled={!canMarkArrived || arrivingId === c._id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          canMarkArrived
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        {arrivingId === c._id ? 'Admitting Patient...' : 'Mark Arrived & Admit Patient'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
