import React, { useState } from 'react';
import { Building2, Wind, Activity, Edit3, Shield, Check, AlertTriangle, X } from 'lucide-react';
import { updateHospital } from '../services/hospitalService';

export default function HospitalsList({ hospitals, onRefresh, isLoading }) {
  const [editingHospital, setEditingHospital] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const startEdit = (hospital) => {
    setEditingHospital(hospital);
    setFormValues({
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds,
      availableIcuBeds: hospital.availableIcuBeds,
      icuBeds: hospital.icuBeds,
      ventilatorsAvailable: hospital.ventilatorsAvailable,
      ventilators: hospital.ventilators,
      oxygenStatus: hospital.oxygenStatus,
    });
    setFeedback(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setFeedback(null);

    const res = await updateHospital(editingHospital._id, formValues);
    setUpdating(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Hospital capacities updated successfully!' });
      setTimeout(() => {
        setEditingHospital(null);
        if (onRefresh) onRefresh();
      }, 1000);
    } else {
      setFeedback({ type: 'error', message: res.error });
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '2rem' }}>
      <div className="glass-card-header">
        <div>
          <h2 className="card-title">
            <Building2 size={22} color="#00d2ff" />
            Varanasi District Hospital Network (Day 3 & 4)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Live bed counters, ICU capacity, ventilator stock, and oxygen status across 10 Varanasi facilities.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={isLoading} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          {isLoading ? 'Syncing...' : 'Sync Hospitals'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
        {hospitals.map((h) => {
          const bedPct = Math.round((h.availableBeds / (h.totalBeds || 1)) * 100);
          const icuPct = Math.round((h.availableIcuBeds / (h.icuBeds || 1)) * 100);
          const isCriticalO2 = h.oxygenStatus === 'critical';
          const isLowO2 = h.oxygenStatus === 'low';

          return (
            <div
              key={h._id}
              style={{
                background: 'rgba(10, 15, 29, 0.75)',
                border: `1px solid ${isCriticalO2 ? 'rgba(255, 51, 102, 0.4)' : isLowO2 ? 'rgba(255, 183, 3, 0.4)' : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{h.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    📍 {h.locality}, {h.district} • ({h.lat.toFixed(4)}, {h.lng.toFixed(4)})
                  </p>
                </div>
                {h.ayushmanEmpanelled && (
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(0, 229, 153, 0.15)', color: '#00e599', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <Shield size={11} /> PM-JAY
                  </span>
                )}
              </div>

              {/* Bed meters */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>General Beds</span>
                  <span style={{ fontWeight: 600, color: bedPct < 15 ? '#ff3366' : '#fff' }}>
                    {h.availableBeds} / {h.totalBeds} ({bedPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, bedPct))}%`,
                      height: '100%',
                      background: bedPct < 15 ? '#ff3366' : bedPct < 40 ? '#ffb703' : '#00e599',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* ICU meters */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ICU Beds</span>
                  <span style={{ fontWeight: 600, color: icuPct < 15 ? '#ff3366' : '#a5b4fc' }}>
                    {h.availableIcuBeds} / {h.icuBeds} ({icuPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, icuPct))}%`,
                      height: '100%',
                      background: icuPct < 15 ? '#ff3366' : '#6366f1',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Status footer chips */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: isCriticalO2 ? 'rgba(255,51,102,0.15)' : isLowO2 ? 'rgba(255,183,3,0.15)' : 'rgba(0,210,255,0.1)',
                      color: isCriticalO2 ? '#ff3366' : isLowO2 ? '#ffb703' : '#00d2ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Wind size={11} /> O₂ {h.oxygenStatus.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    💨 Vents: {h.ventilatorsAvailable}/{h.ventilators}
                  </span>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => startEdit(h)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                  title="Update capacity"
                >
                  <Edit3 size={12} /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Capacity Modal */}
      {editingHospital && (
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
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#0d1322',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Update Capacity: {editingHospital.name}
              </h3>
              <button
                onClick={() => setEditingHospital(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Beds</label>
                  <input
                    type="number"
                    value={formValues.availableBeds}
                    onChange={(e) => setFormValues({ ...formValues, availableBeds: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Beds</label>
                  <input
                    type="number"
                    value={formValues.totalBeds}
                    onChange={(e) => setFormValues({ ...formValues, totalBeds: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available ICU Beds</label>
                  <input
                    type="number"
                    value={formValues.availableIcuBeds}
                    onChange={(e) => setFormValues({ ...formValues, availableIcuBeds: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total ICU Beds</label>
                  <input
                    type="number"
                    value={formValues.icuBeds}
                    onChange={(e) => setFormValues({ ...formValues, icuBeds: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Ventilators</label>
                  <input
                    type="number"
                    value={formValues.ventilatorsAvailable}
                    onChange={(e) => setFormValues({ ...formValues, ventilatorsAvailable: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oxygen Status</label>
                  <select
                    value={formValues.oxygenStatus}
                    onChange={(e) => setFormValues({ ...formValues, oxygenStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#161f36', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="adequate">adequate</option>
                    <option value="low">low</option>
                    <option value="critical">critical</option>
                  </select>
                </div>
              </div>

              {feedback && (
                <div style={{ fontSize: '0.82rem', padding: '0.5rem', borderRadius: '6px', background: feedback.type === 'success' ? 'rgba(0,229,153,0.15)' : 'rgba(255,51,102,0.15)', color: feedback.type === 'success' ? '#00e599' : '#ff3366' }}>
                  {feedback.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingHospital(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving PUT /api/hospitals/:id...' : 'Save Updates (PUT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
