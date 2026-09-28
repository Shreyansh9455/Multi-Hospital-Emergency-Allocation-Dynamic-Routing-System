import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="text-center py-20 px-4 space-y-4 max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
        <AlertTriangle size={36} />
      </div>
      <h1 className="text-3xl font-extrabold text-white">404 - Route Not Found</h1>
      <p className="text-sm text-slate-400">
        The requested routing endpoint or page does not exist in the dispatch system.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
        >
          <Home size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
