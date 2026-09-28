import React, { useState } from 'react';
import { UserPlus, ListOrdered, Sparkles, Send, Clock, MapPin, ShieldAlert, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { createCase, triageCase, dispatchCase } from '../services/caseService';

export default function CasesManager({ cases, hospitals, activeFilter, onFilterChange, onRefresh, isLoading }) {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    severityScore: '',
    symptoms: 'Chest pain, shortness of breath',
    lat: '25.3176',
    lng: '82.9739',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const symptomPresets = [
    'Cardiac arrest',
    'Chest pain',
    'Stroke symptoms',
    'Breathing difficulty',
    'High fever with seizure',
    'Compound fracture',
    'Severe abdominal pain',
    'Sprain',
  ];

  const handleAddPreset = (symptom) => {
    if (formData.symptoms.includes(symptom)) return;
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms ? `${prev.symptoms}, ${symptom}` : symptom,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const symptomTags = formData.symptoms.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      patientName: formData.patientName,
      age: Number(formData.age),
      symptomTags,
      location: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      },
      severityScore: formData.severityScore ? Number(formData.severityScore) : undefined,
      status: 'waiting',
    };

    const res = await createCase(payload);
    setSubmitting(false);

    if (res.success) {
      const triageInfo = res.triageDetails
        ? ` (Auto-triaged Score: ${res.triageDetails.severityScore}/10 - ${res.triageDetails.tier})`
        : '';
      setMessage({ type: 'success', text: `Case created for "${res.data.patientName}"${triageInfo}` });
      setFormData((prev) => ({
        ...prev,
        patientName: '',
        age: '',
        severityScore: '',
      }));
      if (onRefresh) onRefresh();
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  const handleTriageCase = async (caseId) => {
    setActionLoadingId(`triage-${caseId}`);
    const res = await triageCase(caseId);
    setActionLoadingId(null);
    if (res.success) {
      alert(`🩺 Clinical Triage Complete!\nPatient: ${res.data.patientName}\nSeverity Score: ${res.triageDetails.severityScore}/10\nTier: ${res.triageDetails.tier}\nAge Adjustment: +${res.triageDetails.ageAdjustment}`);
      if (onRefresh) onRefresh();
    } else {
      alert(`❌ Triage Failed: ${res.error}`);
    }
  };

  const handleDispatchCase = async (caseId, method) => {
    setActionLoadingId(`dispatch-${caseId}-${method}`);
    const res = await dispatchCase(caseId, method);
    setActionLoadingId(null);
    if (res.success) {
      const details = res.allocationDetails;
      alert(
        `🚨 DISPATCH SUCCESS (${details.method})!\n` +
        `• Hospital: ${details.hospital.name} (${details.hospital.distanceKm} km away)\n` +
        `• Ambulance: ${details.ambulance ? `${details.ambulance.vehicleId} (Driver: ${details.ambulance.driverName}, ETA: ${details.ambulance.etaMinutes} mins)` : 'None available (queued)'}\n` +
        `• Remaining Hospital Beds: ${details.hospital.remainingBeds}`
      );
      if (onRefresh) onRefresh();
    } else {
      alert(`❌ Dispatch Failed: ${res.error}`);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '2rem' }}>
      <div className="glass-card-header">
        <div>
          <h2 className="card-title">
            <ListOrdered size={22} color="#ff3366" />
            Emergency Intake, Triage & Dispatch Center (Days 5, 7, 8, 9, 10)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Multi-factor clinical triage scoring, FIFO vs Priority weighted dispatch routing, and live ambulance ETA telemetry.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.45fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Left Column: Create Case Form */}
        <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus size={16} color="#00d2ff" /> New Emergency Patient Intake
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', background: '#141d33', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  placeholder="45"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', background: '#141d33', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Symptoms (Quick Selection)
              </label>
              <input
                type="text"
                placeholder="Cardiac arrest, chest pain"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', background: '#141d33', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {symptomPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    style={{ fontSize: '0.68rem', padding: '0.18rem 0.45rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Location Lat (GPS)</label>
                <input
                  type="text"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', background: '#141d33', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Location Lng (GPS)</label>
                <input
                  type="text"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', background: '#141d33', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {message && (
              <div style={{ fontSize: '0.82rem', padding: '0.5rem', borderRadius: '6px', background: message.type === 'success' ? 'rgba(0,229,153,0.15)' : 'rgba(255,51,102,0.15)', color: message.type === 'success' ? '#00e599' : '#ff3366' }}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.35rem' }}>
              {submitting ? 'Creating Case...' : 'Register Patient & Auto-Triage'}
            </button>
          </form>
        </div>

        {/* Right Column: Live Cases Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', 'waiting', 'dispatched', 'admitted'].map((st) => (
                <button
                  key={st}
                  onClick={() => onFilterChange(st === 'all' ? '' : st)}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    background: (activeFilter === st || (activeFilter === '' && st === 'all')) ? '#00d2ff' : 'rgba(255,255,255,0.08)',
                    color: (activeFilter === st || (activeFilter === '' && st === 'all')) ? '#000' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={onRefresh} disabled={isLoading} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.3rem' }}>
            {cases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', background: 'rgba(8,12,22,0.4)', borderRadius: '12px' }}>
                No cases found with filter "{activeFilter || 'all'}".
              </div>
            ) : (
              cases.map((c) => {
                const isWaiting = c.status === 'waiting';
                const isDispatched = c.status === 'dispatched';
                const isAdmitted = c.status === 'admitted';

                return (
                  <div
                    key={c._id}
                    style={{
                      background: 'rgba(10, 15, 29, 0.75)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{c.patientName}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({c.age} yrs)</span>
                          {c.severityScore ? (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: c.severityScore >= 8 ? 'rgba(255,51,102,0.2)' : 'rgba(255,183,3,0.2)', color: c.severityScore >= 8 ? '#ff3366' : '#ffb703', fontWeight: 700 }}>
                              Triage Score: {c.severityScore}/10 {c.severityScore >= 8 ? '(Critical)' : '(Urgent)'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Untriaged</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
                          <MapPin size={12} /> ({c.location?.lat?.toFixed(4)}, {c.location?.lng?.toFixed(4)})
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isWaiting ? 'rgba(255,183,3,0.15)' : isDispatched ? 'rgba(0,210,255,0.15)' : 'rgba(0,229,153,0.15)',
                          color: isWaiting ? '#ffb703' : isDispatched ? '#00d2ff' : '#00e599',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>

                    {c.symptomTags && c.symptomTags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {c.symptomTags.map((tag, tIdx) => (
                          <span key={tIdx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '4px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Assigned Hospital & Ambulance details */}
                    {c.assignedHospital && (
                      <div style={{ fontSize: '0.78rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '0.35rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>🏥 <strong>{c.assignedHospital.name || c.assignedHospital}</strong> ({c.assignedHospital.locality || 'Varanasi'})</span>
                        {c.assignedHospital.availableBeds !== undefined && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Beds: {c.assignedHospital.availableBeds}</span>
                        )}
                      </div>
                    )}

                    {c.assignedAmbulance && (
                      <div style={{ fontSize: '0.78rem', color: '#00d2ff', background: 'rgba(0,210,255,0.08)', padding: '0.35rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>🚑 <strong>{c.assignedAmbulance.vehicleId || c.assignedAmbulance}</strong> ({c.assignedAmbulance.driverName || 'Enroute'})</span>
                        {c.etaMinutes && (
                          <span style={{ fontWeight: 700, color: '#00e599' }}>ETA ~{c.etaMinutes} mins</span>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Controls */}
                    {isWaiting && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleTriageCase(c._id)}
                          disabled={actionLoadingId === `triage-${c._id}`}
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', gap: '0.3rem' }}
                        >
                          <Sparkles size={12} color="#00d2ff" />
                          {actionLoadingId === `triage-${c._id}` ? 'Evaluating...' : 'Re-Triage (Day 7)'}
                        </button>

                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDispatchCase(c._id, 'fifo')}
                          disabled={actionLoadingId === `dispatch-${c._id}-fifo`}
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', gap: '0.3rem' }}
                          title="Dispatch to nearest hospital (FIFO)"
                        >
                          <Send size={11} color="#ffb703" />
                          FIFO Dispatch
                        </button>

                        <button
                          className="btn btn-primary"
                          onClick={() => handleDispatchCase(c._id, 'priority')}
                          disabled={actionLoadingId === `dispatch-${c._id}-priority`}
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', gap: '0.3rem', marginLeft: 'auto' }}
                          title="Dispatch using multi-criteria weighted optimization"
                        >
                          <Send size={11} />
                          Priority Dispatch
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
