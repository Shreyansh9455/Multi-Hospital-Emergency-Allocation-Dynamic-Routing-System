import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import Tracking from './pages/Tracking';
import HospitalDetail from './pages/HospitalDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#070c18] text-slate-100 selection:bg-cyan-500 selection:text-slate-900 font-sans">
            {/* Persistent Dynamic Navbar */}
            <Navbar />

            {/* Dynamic Page Routed Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/new-case" element={<NewCase />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/hospital/:id" element={<HospitalDetail />} />
                <Route path="/hospitals/:id" element={<HospitalDetail />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Persistent Command Center Footer */}
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
