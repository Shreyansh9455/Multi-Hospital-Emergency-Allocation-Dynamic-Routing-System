import React from 'react';
import { Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Header({ isHealthy, isChecking }) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo-badge">
          🚑
        </div>
        <div>
          <h1 className="brand-title">
            MED-DISPATCH
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', borderRadius: '6px', fontWeight: 600 }}>
              v1.0.0
            </span>
          </h1>
          <p className="brand-subtitle">Hospital Bed & Emergency Dispatch Manager</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className={`nav-status-badge ${isHealthy ? '' : 'error'}`}>
          <span className={`status-dot ${isHealthy ? 'pulse' : ''}`}></span>
          {isChecking ? (
            <span>Checking System...</span>
          ) : isHealthy ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Backend & DB Active
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={14} /> Backend Disconnected
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
