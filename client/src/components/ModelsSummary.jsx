import React from 'react';
import { Database, Building2, UserCheck, Truck, FileText } from 'lucide-react';

export default function ModelsSummary() {
  const models = [
    {
      name: 'Hospital',
      icon: <Building2 size={18} color="#00d2ff" />,
      tag: 'Resource Model',
      description: 'Hospital facility status, bed counters, ICU capacity, and oxygen availability',
      fields: [
        { name: 'name', type: 'String (Required)' },
        { name: 'locality / district', type: 'String' },
        { name: 'lat / lng', type: 'Number (Coordinates)' },
        { name: 'totalBeds / availableBeds', type: 'Number' },
        { name: 'icuBeds / availableIcuBeds', type: 'Number' },
        { name: 'oxygenStatus', type: 'enum [adequate, low, critical]' },
        { name: 'ventilators / available', type: 'Number' },
        { name: 'ayushmanEmpanelled', type: 'Boolean' },
        { name: 'lastUpdated', type: 'Date (default: now)' },
      ],
    },
    {
      name: 'Case',
      icon: <UserCheck size={18} color="#ff3366" />,
      tag: 'Patient Emergency',
      description: 'Patient intake, triage severity scoring, live location, and resource assignment',
      fields: [
        { name: 'patientName', type: 'String (Required)' },
        { name: 'age', type: 'Number (Required)' },
        { name: 'severityScore', type: 'Number [1-10, default null]' },
        { name: 'symptomTags', type: '[String]' },
        { name: 'location', type: '{ lat, lng }' },
        { name: 'status', type: 'enum [waiting, dispatched, admitted]' },
        { name: 'assignedHospital', type: 'ref: Hospital' },
        { name: 'assignedAmbulance', type: 'ref: Ambulance' },
        { name: 'createdAt', type: 'Date (default: now)' },
      ],
    },
    {
      name: 'Ambulance',
      icon: <Truck size={18} color="#00e599" />,
      tag: 'Fleet Tracking',
      description: 'Emergency vehicle live GPS telemetry, operational status, and active patient link',
      fields: [
        { name: 'driverName', type: 'String (Required)' },
        { name: 'vehicleId', type: 'String (Unique)' },
        { name: 'currentLocation', type: '{ lat, lng }' },
        { name: 'status', type: 'enum [idle, enroute, busy]' },
        { name: 'assignedCase', type: 'ref: Case' },
      ],
    },
    {
      name: 'DispatchLog',
      icon: <FileText size={18} color="#ffb703" />,
      tag: 'Audit & Analytics',
      description: 'Audit trail of response times, arrival delays, and triage allocation algorithm',
      fields: [
        { name: 'caseId', type: 'ref: Case (Required)' },
        { name: 'hospitalId', type: 'ref: Hospital (Required)' },
        { name: 'ambulanceId', type: 'ref: Ambulance (Required)' },
        { name: 'dispatchTime', type: 'Date' },
        { name: 'arrivalTime', type: 'Date' },
        { name: 'waitTimeMinutes', type: 'Number' },
        { name: 'treatmentStartTime', type: 'Date' },
        { name: 'method', type: 'enum [FIFO, priority]' },
      ],
    },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <h2 className="models-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={22} color="#00d2ff" />
            Day 2: Mongoose Database Schemas
          </h2>
          <p className="models-section-desc">
            4 foundational MongoDB collections established with strict schemas, validation rules, indexing, and relational references.
          </p>
        </div>
      </div>

      <div className="models-grid">
        {models.map((model, idx) => (
          <div key={idx} className="model-card">
            <div className="model-header">
              <div className="model-name">
                {model.icon}
                {model.name}
              </div>
              <span className="model-badge">{model.tag}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
              {model.description}
            </p>
            <div className="field-list">
              {model.fields.map((field, fIdx) => {
                const isRef = field.type.includes('ref:');
                const isEnum = field.type.includes('enum');
                return (
                  <div key={fIdx} className="field-item">
                    <span className="field-name">{field.name}</span>
                    <span className={`field-type ${isRef ? 'ref' : ''} ${isEnum ? 'enum' : ''}`}>
                      {field.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
