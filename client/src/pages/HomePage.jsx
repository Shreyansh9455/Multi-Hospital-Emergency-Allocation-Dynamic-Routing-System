import React, { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../services/healthService';
import { getHospitals } from '../services/hospitalService';
import { getCases } from '../services/caseService';
import { getAmbulances } from '../services/ambulanceService';
import HealthStatusCard from '../components/HealthStatusCard';
import SystemOverview from '../components/SystemOverview';
import HospitalsList from '../components/HospitalsList';
import CasesManager from '../components/CasesManager';
import AmbulancesFleet from '../components/AmbulancesFleet';
import ModelsSummary from '../components/ModelsSummary';
import { HeartPulse } from 'lucide-react';

export default function HomePage({ onStatusUpdate }) {
  const [healthData, setHealthData] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [latency, setLatency] = useState(null);

  const [hospitals, setHospitals] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  const [cases, setCases] = useState([]);
  const [caseFilter, setCaseFilter] = useState('');
  const [isLoadingCases, setIsLoadingCases] = useState(false);

  const [ambulances, setAmbulances] = useState([]);
  const [isLoadingAmbulances, setIsLoadingAmbulances] = useState(false);

  // Health check
  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    const startTime = performance.now();
    try {
      const res = await checkHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));

      if (res.success) {
        setHealthData(res.data);
        if (onStatusUpdate) onStatusUpdate(true, false);
      } else {
        setHealthData({ status: 'error', message: res.error });
        if (onStatusUpdate) onStatusUpdate(false, false);
      }
    } catch (err) {
      setHealthData({ status: 'error', message: err.message });
      if (onStatusUpdate) onStatusUpdate(false, false);
    } finally {
      setIsLoadingHealth(false);
    }
  }, [onStatusUpdate]);

  // Fetch Hospitals
  const fetchHospitals = useCallback(async () => {
    setIsLoadingHospitals(true);
    const res = await getHospitals();
    if (res.success) {
      setHospitals(res.data);
    }
    setIsLoadingHospitals(false);
  }, []);

  // Fetch Cases
  const fetchCases = useCallback(async () => {
    setIsLoadingCases(true);
    const params = caseFilter ? { status: caseFilter } : {};
    const res = await getCases(params);
    if (res.success) {
      setCases(res.data);
    }
    setIsLoadingCases(false);
  }, [caseFilter]);

  // Fetch Ambulances
  const fetchAmbulances = useCallback(async () => {
    setIsLoadingAmbulances(true);
    const res = await getAmbulances();
    if (res.success) {
      setAmbulances(res.data);
    }
    setIsLoadingAmbulances(false);
  }, []);

  const refreshAll = useCallback(() => {
    fetchHealth();
    fetchHospitals();
    fetchCases();
    fetchAmbulances();
  }, [fetchHealth, fetchHospitals, fetchCases, fetchAmbulances]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-tag">
          <HeartPulse size={14} /> Multi-Hospital Emergency Allocation & Dynamic Routing
        </div>
        <h1 className="hero-title">
          Hospital Bed & <span>Emergency Dispatch</span> Manager
        </h1>
        <p className="hero-desc">
          Intelligent real-time emergency healthcare routing, automated bed triage, ICU capacity tracking, and fleet telemetry across Varanasi district.
        </p>
      </section>

      {/* Main Grid: Health Card + Implementation Roadmap */}
      <div className="dashboard-grid">
        <HealthStatusCard
          healthData={healthData}
          isLoading={isLoadingHealth}
          onRefresh={fetchHealth}
          latency={latency}
        />
        <SystemOverview />
      </div>

      {/* Emergency Cases & Triage/Dispatch Control */}
      <CasesManager
        cases={cases}
        hospitals={hospitals}
        activeFilter={caseFilter}
        onFilterChange={setCaseFilter}
        onRefresh={refreshAll}
        isLoading={isLoadingCases}
      />

      {/* Ambulances Fleet GPS Tracking */}
      <AmbulancesFleet
        ambulances={ambulances}
        onRefresh={fetchAmbulances}
        isLoading={isLoadingAmbulances}
      />

      {/* Varanasi Hospital Network & Bed Capacity Updater */}
      <HospitalsList
        hospitals={hospitals}
        onRefresh={fetchHospitals}
        isLoading={isLoadingHospitals}
      />

      {/* Mongoose Database Schemas Visualizer */}
      <ModelsSummary />
    </div>
  );
}
