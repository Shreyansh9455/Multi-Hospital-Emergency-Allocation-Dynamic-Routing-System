import React, { useState } from 'react';
import { Truck, Navigation, CheckCircle, Clock, Plus, MapPin, User, AlertCircle, RefreshCw } from 'lucide-react';
import { createAmbulance, updateAmbulanceStatus } from '../services/ambulanceService';

export default function AmbulancesFleet({ ambulances, onRefresh, isLoading }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    vehicleId: '',
    lat: '25.3176',
    lng: '82.9739',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const res = await createAmbulance({
      driverName: formData.driverName,
      vehicleId: formData.vehicleId,
      currentLocation: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      },
      status: 'idle',
    });

    setSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', text: `Ambulance ${res.data.vehicleId} registered!` });
      setTimeout(() => {
        setShowAddModal(false);
        setFormData({ driverName: '', vehicleId: '', lat: '25.3176', lng: '82.9739' });
        if (onRefresh) onRefresh();
      }, 1000);
    } else {
      setFeedback({ type: 'error', text: res.error });
    }
  };

  const handleMarkArrived = async (ambulanceId) => {
    const res = await updateAmbulanceStatus(ambulanceId, 'arrived');
    if (res.success) {
      alert(`✅ Patient arrived at emergency ward! Case marked ADMITTED and wait time logged.`);
      if (onRefresh) onRefresh();
    } else {
      alert(`❌ Failed to update status: ${res.error}`);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '2rem' }}>
      <div className="glass-card-header">
        <div>
          <h2 className="card-title">
            <Truck size={22} color="#00e599" />
            Ambulance Fleet & GPS Telemetry (Day 6 & 10)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time ambulance fleet status, dynamic GPS coordinates, and arrival admission lifecycle.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.35rem' }}
          >
            <Plus size={14} /> Register Ambulance
          </button>
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={isLoading}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {ambulances.map((amb) => {
          const isIdle = amb.status === 'idle';
          const isEnroute = amb.status === 'enroute';
          const isBusy = amb.status === 'busy';

          return (
            <div
              key={amb._id}
              style={{
                background: 'rgba(10, 15, 29, 0.75)',
                border: `1px solid ${isEnroute ? 'rgba(0, 210, 255, 0.4)' : isBusy ? 'rgba(255, 51, 102, 0.4)' : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isEnroute ? 'rgba(0, 210, 255, 0.2)' : 'rgba(0, 229, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={16} color={isEnroute ? '#00d2ff' : '#00e599'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{amb.vehicleId}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <User size={11} /> {amb.driverName}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    background: isIdle ? 'rgba(0, 229, 153, 0.15)' : isEnroute ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                    color: isIdle ? '#00e599' : isEnroute ? '#00d2ff' : '#ff3366',
                  }}
                >
                  {amb.status}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.25)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                <MapPin size={13} color="#ffb703" />
                <span>GPS: ({amb.currentLocation?.lat?.toFixed(4)}, {amb.currentLocation?.lng?.toFixed(4)})</span>
              </div>

              {amb.assignedCase && (
                <div style={{ fontSize: '0.75rem', color: '#00d2ff', background: 'rgba(0,210,255,0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                  🚨 Assigned to Patient: <strong>{amb.assignedCase.patientName || amb.assignedCase}</strong>
                </div>
              )}

              {isEnroute && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleMarkArrived(amb._id)}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', width: '100%', marginTop: '0.25rem', gap: '0.35rem' }}
                >
                  <CheckCircle size={13} /> Mark Arrived & Admit Patient
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Ambulance Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: '#0d1322' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Register New Ambulance (Day 6)
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driver Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Pal"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehicle Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP-65-AM-707"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Lat</label>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Lng</label>
                  <input
                    type="text"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {feedback && (
                <div style={{ fontSize: '0.8rem', padding: '0.45rem', borderRadius: '6px', background: feedback.type === 'success' ? 'rgba(0,229,153,0.15)' : 'rgba(255,51,102,0.15)', color: feedback.type === 'success' ? '#00e599' : '#ff3366' }}>
                  {feedback.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
