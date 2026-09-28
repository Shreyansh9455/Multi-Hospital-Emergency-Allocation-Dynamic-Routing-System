import React from 'react';
import { Activity, RefreshCw, Database, Server, Clock, Wifi } from 'lucide-react';

export default function HealthStatusCard({ healthData, isLoading, onRefresh, latency }) {
  const isConnected = healthData?.status === 'ok';
  const dbConnected = healthData?.database?.connected;

  return (
    <div className={`glass-card health-status-card ${isConnected ? 'status-ok' : ''}`}>
      <div className="glass-card-header">
        <h2 className="card-title">
          <Activity size={20} color={isConnected ? '#00e599' : '#ff3366'} />
          Live Backend Health Status
        </h2>
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          title="Re-ping health endpoint"
        >
          <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
          {isLoading ? 'Pinging...' : 'Test Connection'}
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Endpoint: <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>GET /api/health</code>
      </p>

      <div className="health-metric-grid">
        <div className="metric-box">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Server size={12} /> Server Status
          </span>
          <span className={`metric-value ${isConnected ? 'highlight-emerald' : 'highlight-amber'}`}>
            {isConnected ? 'ONLINE (200 OK)' : 'OFFLINE / ERROR'}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Database size={12} /> MongoDB Database
          </span>
          <span className={`metric-value ${dbConnected ? 'highlight-emerald' : 'highlight-amber'}`}>
            {dbConnected ? 'CONNECTED' : (healthData?.database?.status || 'DISCONNECTED').toUpperCase()}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wifi size={12} /> API Latency
          </span>
          <span className="metric-value highlight-cyan">
            {latency !== null ? `${latency} ms` : '—'}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={12} /> Server Uptime
          </span>
          <span className="metric-value">
            {healthData?.uptime !== undefined ? `${healthData.uptime}s` : '—'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>
          Raw API Response Payload:
        </span>
        <pre className="json-preview">
          {JSON.stringify(healthData || { status: 'loading or unavailable' }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
