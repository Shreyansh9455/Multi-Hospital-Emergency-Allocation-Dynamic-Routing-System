import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Shield, Lock, Mail, AlertCircle, Building2, Ambulance, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_ACCOUNTS = [
  {
    role: 'districtAdmin',
    label: 'District Admin',
    desc: 'Full Access (Dashboard, Map, Analytics, All Hospitals & Fleet)',
    email: 'admin@meddispatch.varanasi.gov.in',
    password: 'Password@123',
    icon: <Shield className="w-4 h-4 text-purple-400" />,
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    role: 'hospitalStaff',
    label: 'Hospital Staff (BHU)',
    desc: 'Manage bed/ICU/O2 inventory for Sir Sundarlal Hospital (BHU)',
    email: 'staff.bhu@meddispatch.varanasi.gov.in',
    password: 'Password@123',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'ambulanceDriver',
    label: 'Ambulance Driver',
    desc: 'Telemetry & Patient Arrival Handover (UP-65-AM-101)',
    email: 'driver1@meddispatch.varanasi.gov.in',
    password: 'Password@123',
    icon: <Ambulance className="w-4 h-4 text-amber-400" />,
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
];

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@meddispatch.varanasi.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePreset, setActivePreset] = useState('districtAdmin');

  const redirectPath = location.state?.from?.pathname || '/';

  const selectPreset = (account) => {
    setActivePreset(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify email and password.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 animate-fadeIn">
      <div className="bg-slate-900/90 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-cyan-500/20">
            🏥
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Command Center Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-Hospital Emergency Allocation & Dynamic Routing System
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Role Switcher Presets */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Quick 1-Click Role Presets (Seeded Demo Accounts)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = activePreset === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => selectPreset(acc)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      {acc.icon}
                      <span>{acc.label.split(' ')[0]}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {acc.role === 'districtAdmin' ? 'Admin / Full' : acc.role === 'hospitalStaff' ? 'BHU Staff' : 'Ambulance'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@meddispatch.varanasi.gov.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Authenticate & Access Command Center</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer info note */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Secure JWT-backed Role-Based Access System. District emergency coordinators, hospital triage teams, and registered ambulance drivers only.
          </p>
        </div>
      </div>
    </div>
  );
}
