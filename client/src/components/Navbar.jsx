import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Radio,
  BarChart3,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Menu,
  X,
  Building2,
  Ambulance,
} from 'lucide-react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, role, isDistrictAdmin } = useAuth();
  const navigate = useNavigate();
  const [isHealthy, setIsHealthy] = useState(true);
  const [checking, setChecking] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const ping = async () => {
      setChecking(true);
      const res = await checkHealth();
      setIsHealthy(res.success && res.data.database?.connected);
      setChecking(false);
    };

    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/new-case', label: 'New Case', icon: <PlusCircle size={16} /> },
    { to: '/tracking', label: 'Live Tracking', icon: <Radio size={16} /> },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: <BarChart3 size={16} />,
      badge: !isDistrictAdmin && isAuthenticated ? 'Admin' : null,
    },
  ];

  const getRoleBadge = () => {
    if (!user) return null;
    switch (role) {
      case 'districtAdmin':
        return { label: 'District Admin', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'hospitalStaff':
        return { label: 'Hospital Staff', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'ambulanceDriver':
        return { label: 'Ambulance Driver', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      default:
        return { label: role, color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-50 bg-[#0b1329]/90 backdrop-blur-xl border-b border-cyan-500/15 px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Section */}
        <NavLink to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            🚑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                MED-DISPATCH
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                VARANASI
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              Emergency Allocation & Dynamic Routing
            </p>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: System Health + Auth User Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Live System Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px]">
              {checking ? 'Checking' : isHealthy ? 'Socket & DB Online' : 'Offline'}
            </span>
          </div>

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {user.name.split(' ')[0]}
                </span>
                {roleBadge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                title="Logout from session"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-red-500/30 transition-all"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs md:text-sm font-semibold shadow-md shadow-cyan-500/20 transition-all"
            >
              <LogIn size={15} />
              <span>Login</span>
            </NavLink>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-1.5 pb-2 animate-fadeIn">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}

          {isAuthenticated && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <User size={14} className="text-cyan-400" />
                <span>{user.name} ({roleBadge?.label})</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

