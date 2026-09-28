import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Sparkles,
  Crosshair,
  Building2,
  Truck,
  Clock,
  Radio,
  ShieldAlert,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { createCase, triageCase, dispatchCase } from '../services/api';

const PREDEFINED_SYMPTOMS = [
  'cardiac arrest',
  'chest pain',
  'unconscious',
  'severe bleeding',
  'stroke symptoms',
  'breathing difficulty',
  'severe burns',
  'high fever with seizure',
  'severe abdominal pain',
  'fracture',
  'moderate injury',
  'deep cut',
  'persistent vomiting',
  'minor fracture',
  'minor injury',
  'mild fever',
  'sprain',
];

export default function NewCase() {
  const navigate = useNavigate();

  // Form states
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [lat, setLat] = useState('25.3176');
  const [lng, setLng] = useState('82.9739');

  // UI / validation & submission states
  const [errors, setErrors] = useState({});
  const [submittingStep, setSubmittingStep] = useState(null); // 'creating' | 'triaging' | 'dispatching' | null
  const [flowError, setFlowError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);

  // Toggle symptom pill
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
    if (errors.symptoms) {
      setErrors((prev) => ({ ...prev, symptoms: null }));
    }
  };

  // Browser Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Locating coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(4));
        setLng(position.coords.longitude.toFixed(4));
        setLocationStatus('📍 GPS coordinates captured!');
        if (errors.lat || errors.lng) {
          setErrors((prev) => ({ ...prev, lat: null, lng: null }));
        }
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (err) => {
        console.warn('Geolocation error / denied:', err.message);
        setLat('25.3176');
        setLng('82.9739');
        setLocationStatus('Using Varanasi City Center GPS (25.3176, 82.9739)');
        setTimeout(() => setLocationStatus(''), 4000);
      },
      { timeout: 8000 }
    );
  };

  // Client-side validation
  const validateForm = () => {
    const errs = {};

    if (!patientName || patientName.trim().length === 0) {
      errs.patientName = 'Patient full name is required';
    }

    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      errs.age = 'Age is required and must be a positive number';
    }

    if (selectedSymptoms.length === 0) {
      errs.symptoms = 'Please select at least one clinical symptom tag';
    }

    if (!lat || isNaN(Number(lat))) {
      errs.lat = 'Valid latitude coordinate is required';
    }

    if (!lng || isNaN(Number(lng))) {
      errs.lng = 'Valid longitude coordinate is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 3-Step Backend Flow (Day 16)
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setFlowError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Step 1: Create Case
      setSubmittingStep('Creating emergency case in network...');
      const createPayload = {
        patientName: patientName.trim(),
        age: Number(age),
        symptomTags: selectedSymptoms,
        location: {
          lat: Number(lat),
          lng: Number(lng),
        },
        status: 'waiting',
      };

      const createRes = await createCase(createPayload);
      if (!createRes.success) {
        throw new Error(createRes.error || 'Failed to register emergency case');
      }

      const caseId = createRes.data._id;

      // Step 2: Clinical Triage Scoring
      setSubmittingStep('Evaluating multi-factor clinical triage score...');
      const triageRes = await triageCase(caseId);
      if (!triageRes.success) {
        throw new Error(triageRes.error || 'Failed to complete triage scoring');
      }

      // Step 3: Priority Weighted Dispatch
      setSubmittingStep('Optimizing hospital allocation & dispatching nearest ambulance...');
      const dispatchRes = await dispatchCase(caseId, 'priority');
      if (!dispatchRes.success) {
        throw new Error(dispatchRes.error || 'Failed to dispatch hospital & ambulance');
      }

      // Successful End-to-End Result
      setSubmittingStep(null);
      setDispatchResult({
        case: dispatchRes.data,
        allocation: dispatchRes.allocationDetails,
        triage: triageRes.triageDetails,
        dispatchLog: dispatchRes.dispatchLog,
      });
    } catch (err) {
      setSubmittingStep(null);
      setFlowError(err.message || 'An unexpected error occurred during emergency dispatch');
    }
  };

  // Severity Badge Helper
  const getSeverityBadge = (score) => {
    if (score >= 8) {
      return {
        label: `Critical Triage (${score}/10)`,
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-crimson',
        dot: 'bg-rose-400',
      };
    }
    if (score >= 5) {
      return {
        label: `Urgent Triage (${score}/10)`,
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    }
    return {
      label: `Low Urgency (${score}/10)`,
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald',
      dot: 'bg-emerald-400',
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group mb-3"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-glow-cyan">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Emergency Patient Intake & Dispatch</h1>
            <p className="text-sm text-slate-400">
              Automated 3-stage pipeline: Intake Registration ➔ Clinical Triage ➔ Priority Weighted Dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {flowError && (
        <div className="glass-panel p-5 border border-rose-500/40 bg-rose-950/30 space-y-2">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-base">
            <AlertCircle size={20} />
            Emergency Dispatch Error
          </div>
          <p className="text-sm text-slate-300">{flowError}</p>
        </div>
      )}

      {/* Success Result Screen (Day 16) */}
      {dispatchResult ? (
        <div className="glass-panel p-6 sm:p-8 space-y-6 border border-cyan-500/30 bg-slate-900/90 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Emergency Dispatch Confirmed & Enroute</h2>
                <p className="text-xs text-slate-400">
                  Patient: <strong className="text-white">{dispatchResult.case.patientName}</strong> ({dispatchResult.case.age} yrs) • Case ID: <span className="font-mono text-cyan-400">{dispatchResult.case._id}</span>
                </p>
              </div>
            </div>

            {/* Severity Badge */}
            {(() => {
              const badge = getSeverityBadge(dispatchResult.case.severityScore || 5);
              return (
                <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 self-start sm:self-auto ${badge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${badge.dot} pulse-animation`} />
                  {badge.label}
                </div>
              );
            })()}
          </div>

          {/* Allocation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Assigned Hospital */}
            <div className="bg-slate-950/70 p-5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Building2 size={18} /> Assigned Hospital Facility
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {dispatchResult.allocation.hospital.distanceKm} km away
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {dispatchResult.allocation.hospital.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-amber-400" /> {dispatchResult.allocation.hospital.locality}, Varanasi District
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-2 border-t border-white/5 font-mono">
                <div>Remaining Beds: <strong className="text-emerald-400">{dispatchResult.allocation.hospital.remainingBeds}</strong></div>
                {dispatchResult.allocation.hospital.remainingIcuBeds !== undefined && (
                  <div>ICU: <strong className="text-indigo-300">{dispatchResult.allocation.hospital.remainingIcuBeds}</strong></div>
                )}
              </div>
            </div>

            {/* Assigned Ambulance & ETA */}
            <div className="bg-slate-950/70 p-5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Truck size={18} /> Assigned Emergency Vehicle
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  STATUS: ENROUTE
                </span>
              </div>

              {dispatchResult.allocation.ambulance ? (
                <>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      {dispatchResult.allocation.ambulance.vehicleId}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Paramedic / Driver: <strong className="text-slate-200">{dispatchResult.allocation.ambulance.driverName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Clock size={13} />
                      <span>Estimated ETA: ~{dispatchResult.allocation.ambulance.etaMinutes} mins</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      Arrival ~{new Date(dispatchResult.allocation.ambulance.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-xs text-amber-400">
                  All ambulances currently busy. Case queued for immediate next available vehicle.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setDispatchResult(null);
                setPatientName('');
                setAge('');
                setSelectedSymptoms([]);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Register Another Patient
            </button>
            <button
              onClick={() => navigate('/tracking')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Radio size={16} /> Track Fleet & Admittance in Live Console
            </button>
          </div>
        </div>
      ) : (
        /* Emergency Intake Form */
        <div className="glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <form onSubmit={handleDispatchSubmit} className="space-y-6">
            {/* Row 1: Patient Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Patient Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anand Vardhan"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: null }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white text-sm focus:outline-none transition-colors ${
                    errors.patientName ? 'border-rose-500 focus:border-rose-400' : 'border-white/10 focus:border-cyan-500'
                  }`}
                />
                {errors.patientName && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.patientName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Age (Years) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  placeholder="48"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    if (errors.age) setErrors((prev) => ({ ...prev, age: null }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white font-mono text-sm focus:outline-none transition-colors ${
                    errors.age ? 'border-rose-500 focus:border-rose-400' : 'border-white/10 focus:border-cyan-500'
                  }`}
                />
                {errors.age && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.age}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Symptom Tags Multi-Select */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Clinical Symptom Tags (Multi-Select) <span className="text-rose-400">*</span>
                </label>
                <span className="text-xs font-semibold text-cyan-400">
                  {selectedSymptoms.length} tag{selectedSymptoms.length !== 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                {PREDEFINED_SYMPTOMS.map((symptom) => {
                  const isSelected = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                      {symptom}
                    </button>
                  );
                })}
              </div>

              {errors.symptoms && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {errors.symptoms}
                </p>
              )}
            </div>

            {/* Row 3: GPS Coordinates & "Use My Current Location" */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin size={14} className="text-cyan-400" /> Patient Emergency Location (GPS) <span className="text-rose-400">*</span>
                </label>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors self-start sm:self-auto"
                >
                  <Crosshair size={13} /> Use My Current Location
                </button>
              </div>

              {locationStatus && (
                <p className="text-xs text-cyan-400 font-medium">{locationStatus}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Latitude</span>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => {
                      setLat(e.target.value);
                      if (errors.lat) setErrors((prev) => ({ ...prev, lat: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white font-mono text-sm focus:outline-none transition-colors ${
                      errors.lat ? 'border-rose-500' : 'border-white/10 focus:border-cyan-500'
                    }`}
                  />
                  {errors.lat && <p className="text-xs text-rose-400">{errors.lat}</p>}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Longitude</span>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => {
                      setLng(e.target.value);
                      if (errors.lng) setErrors((prev) => ({ ...prev, lng: null }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white font-mono text-sm focus:outline-none transition-colors ${
                      errors.lng ? 'border-rose-500' : 'border-white/10 focus:border-cyan-500'
                    }`}
                  />
                  {errors.lng && <p className="text-xs text-rose-400">{errors.lng}</p>}
                </div>
              </div>
            </div>

            {/* Form Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={Boolean(submittingStep)}
                className="px-7 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center gap-2"
              >
                {submittingStep ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {submittingStep}
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Dispatch Emergency (Triage ➔ Priority)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
