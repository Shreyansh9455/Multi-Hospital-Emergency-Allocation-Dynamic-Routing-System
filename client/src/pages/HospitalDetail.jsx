import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Wind,
  Activity,
  ArrowLeft,
  Shield,
  Check,
  Edit3,
  MapPin,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { getHospitalById, updateHospital } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Format timestamp nicely into human-readable relative time or localized date
 */
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleString();
}

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDistrictAdmin, isHospitalStaff, user, isAuthenticated } = useAuth();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    availableBeds: 0,
    totalBeds: 0,
    availableIcuBeds: 0,
    icuBeds: 0,
    ventilatorsAvailable: 0,
    ventilators: 0,
    oxygenStatus: 'adequate',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Day 26: Check if current user can edit this hospital
  const assignedHospitalId = user?.assignedHospital?._id || user?.assignedHospital;
  const canEdit = isDistrictAdmin || (isHospitalStaff && String(assignedHospitalId) === String(id));

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getHospitalById(id);
    if (res.success) {
      setHospital(res.data);
      setForm({
        availableBeds: res.data.availableBeds,
        totalBeds: res.data.totalBeds,
        availableIcuBeds: res.data.availableIcuBeds,
        icuBeds: res.data.icuBeds,
        ventilatorsAvailable: res.data.ventilatorsAvailable,
        ventilators: res.data.ventilators,
        oxygenStatus: res.data.oxygenStatus,
      });
    } else {
      setError(res.error || 'Failed to load hospital details');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setFeedback({ type: 'error', text: 'You are not authorized to update this hospital facility.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      availableBeds: Number(form.availableBeds),
      totalBeds: Number(form.totalBeds),
      availableIcuBeds: Number(form.availableIcuBeds),
      icuBeds: Number(form.icuBeds),
      ventilatorsAvailable: Number(form.ventilatorsAvailable),
      ventilators: Number(form.ventilators),
      oxygenStatus: form.oxygenStatus,
    };

    const res = await updateHospital(id, payload);
    setSaving(false);

    if (res.success) {
      setHospital(res.data);
      setFeedback({ type: 'success', text: 'Hospital capacity and metrics updated successfully! Broadcast live over WebSocket.' });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', text: res.error });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3 animate-pulse">
        <RefreshCw size={32} className="text-cyan-400 animate-spin mx-auto" />
        <div className="text-base text-slate-400 font-semibold">Loading Hospital Telemetry...</div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle size={40} className="text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Hospital Record Not Found</h2>
        <p className="text-sm text-slate-400">{error || `No facility found matching ID: ${id}`}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const freePercent = hospital.totalBeds > 0 ? Math.round((hospital.availableBeds / hospital.totalBeds) * 100) : 0;
  const icuPercent = hospital.icuBeds > 0 ? Math.round((hospital.availableIcuBeds / hospital.icuBeds) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Back Navigation */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition group mb-3 cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        {/* Title Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{hospital.name}</h1>
                {hospital.ayushmanEmpanelled && (
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1">
                    <Shield size={12} /> Ayushman PM-JAY
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1.5">
                <MapPin size={14} className="text-amber-400 shrink-0" />
                <span>{hospital.locality}, {hospital.district}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs text-slate-400">GPS: ({hospital.lat.toFixed(4)}, {hospital.lng.toFixed(4)})</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-auto bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <Clock size={13} className="text-cyan-400" />
              <span>Last Updated: <strong className="text-white">{formatRelativeTime(hospital.lastUpdated)}</strong></span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">General Beds</span>
              <div className="text-2xl font-bold font-mono text-white">
                {hospital.availableBeds} <span className="text-sm font-normal text-slate-400">/ {hospital.totalBeds}</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">{freePercent}% Available</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">ICU Capacity</span>
              <div className="text-2xl font-bold font-mono text-indigo-300">
                {hospital.availableIcuBeds} <span className="text-sm font-normal text-slate-400">/ {hospital.icuBeds}</span>
              </div>
              <div className="text-[11px] text-indigo-300 font-medium">{icuPercent}% Available</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">Ventilator Stock</span>
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {hospital.ventilatorsAvailable} <span className="text-sm font-normal text-slate-400">/ {hospital.ventilators}</span>
              </div>
              <div className="text-[11px] text-cyan-400 font-medium">Ready for Dispatch</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">Oxygen Supply</span>
              <div className={`text-xl font-bold uppercase mt-1 ${hospital.oxygenStatus === 'critical' ? 'text-rose-400' : hospital.oxygenStatus === 'low' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hospital.oxygenStatus}
              </div>
              <div className="text-[11px] text-slate-400">Pressure Telemetry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Staff Capacity Update Form (Day 14 & 26: RBAC Restricted) */}
      <div className="bg-slate-900/90 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <Edit3 size={20} className="text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold">Facility Capacity & Triage Stock Editor</h2>
          </div>

          {!canEdit && (
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Lock size={12} /> Read-Only Mode
            </span>
          )}
        </div>

        {!canEdit ? (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Role Permission Notice</p>
              <p className="text-slate-400 text-xs">
                Capacity adjustments are restricted to staff assigned to <strong className="text-slate-200">{hospital.name}</strong> or District Administrators. Please log in with the facility's staff account to update live bed availability.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400">
            Staff update portal: modifications to available beds, ICU counts, oxygen pressure, and ventilator stock persist to MongoDB via <code className="text-cyan-400 bg-black/30 px-1.5 py-0.5 rounded">PUT /api/hospitals/:id</code> and instantly emit real-time <code className="text-emerald-400 bg-black/30 px-1.5 py-0.5 rounded">hospitalUpdated</code> events across all active connected clients.
          </p>
        )}

        <form onSubmit={handleUpdate} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Available Beds</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.availableBeds}
                onChange={(e) => setForm({ ...form, availableBeds: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Total Bed Capacity</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.totalBeds}
                onChange={(e) => setForm({ ...form, totalBeds: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Available ICU Beds</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.availableIcuBeds}
                onChange={(e) => setForm({ ...form, availableIcuBeds: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Total ICU Beds</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.icuBeds}
                onChange={(e) => setForm({ ...form, icuBeds: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Available Ventilators</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.ventilatorsAvailable}
                onChange={(e) => setForm({ ...form, ventilatorsAvailable: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Total Ventilators</label>
              <input
                type="number"
                required
                min="0"
                disabled={!canEdit}
                value={form.ventilators}
                onChange={(e) => setForm({ ...form, ventilators: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Oxygen Stock Status</label>
              <select
                disabled={!canEdit}
                value={form.oxygenStatus}
                onChange={(e) => setForm({ ...form, oxygenStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-400 capitalize disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="adequate">Adequate</option>
                <option value="low">Low Alert</option>
                <option value="critical">Critical Shortage</option>
              </select>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={fetchDetails}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Reset Values
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                {saving ? 'Updating Capacities...' : 'Save Hospital Updates (PUT)'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

