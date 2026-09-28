import React from 'react';
import { CheckCircle2, Layers } from 'lucide-react';

export default function SystemOverview() {
  const milestones = [
    {
      title: 'Days 1 & 2: MERN Core & Schema Foundations',
      items: [
        'Vite + React frontend with dark command-center design system & Axios services',
        'Express backend with MongoDB Mongoose connection & /api/health endpoint',
        '4 Models: Hospital, Case, Ambulance, DispatchLog with schema indexes',
      ],
    },
    {
      title: 'Days 3 & 4: Varanasi Hospital Fleet & REST API',
      items: [
        '10 real Varanasi hospitals seeded with capacity variation & Ayushman flags',
        'GET /api/hospitals (list & filter) and GET /api/hospitals/:id',
        'PUT /api/hospitals/:id capacity validation & auto lastUpdated updates',
      ],
    },
    {
      title: 'Days 5 & 6: Case Intake & Ambulance Fleet API',
      items: [
        'POST & GET /api/cases with query filtering (?status=waiting|dispatched|admitted)',
        'GET /api/ambulances, POST /api/ambulances, PUT /api/ambulances/:id',
        '5 sample ambulances seeded across Varanasi district hubs in idle state',
      ],
    },
    {
      title: 'Day 7: Clinical Triage Scoring Service',
      items: [
        'Rule table mapping clinical symptoms to severity scores (1–10)',
        'Age adjustment (+1 for pediatric <5 or geriatric >65, capped at 10)',
        'POST /api/cases/:id/triage running scoring & saving severityScore',
      ],
    },
    {
      title: 'Days 8, 9 & 10: Dispatch Optimization & Ambulance Telemetry',
      items: [
        'Haversine distance calculation with 15 km search radius and ICU gating',
        'FIFO (distance) vs Priority (weighted distance + occupancy + oxygen penalty)',
        'Auto-assigned nearest idle ambulance + 30 km/h traffic ETA calculation',
        'PUT /api/ambulances/:id/status (arrived -> admitted + DispatchLog timing)',
      ],
    },
  ];

  return (
    <div className="glass-card">
      <div className="glass-card-header">
        <h2 className="card-title">
          <Layers size={20} color="#00d2ff" />
          System Implementation Roadmap
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#00e599', fontWeight: 600, background: 'rgba(0, 229, 153, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
          Days 1 – 10 Completed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {milestones.map((milestone, idx) => (
          <div key={idx} style={{ background: 'rgba(8, 12, 22, 0.5)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                {idx + 1}
              </span>
              {milestone.title}
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {milestone.items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <CheckCircle2 size={13} color="#00e599" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
