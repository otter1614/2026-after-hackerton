import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Map as MapIcon, Camera, Trophy, LayoutDashboard, Menu, X, Skull } from 'lucide-react';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Ranking from './pages/Ranking';
import PoliceDashboard from './pages/PoliceDashboard';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: '홈 (지도)', icon: MapIcon },
    { path: '/explore', name: '탐험 (카메라)', icon: Camera },
    { path: '/ranking', name: '랭킹', icon: Trophy },
    { path: '/dashboard', name: '대시보드', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-ghost-surface border-t border-ghost-purple/30 z-40">
      <div className="flex max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all border-t-2 relative ${
                isActive 
                  ? 'border-ghost-neon bg-ghost-neon/5 shadow-[0_-10px_20px_rgba(0,255,0,0.05)]' 
                  : 'border-white/10 hover:border-ghost-purple/50'
              }`}
            >
              <div className={`w-2 h-2 absolute top-1 left-1 ${isActive ? 'bg-ghost-neon' : 'bg-white/10'}`} />
              <item.icon size={18} className={isActive ? 'text-ghost-neon' : 'text-white/40'} />
              <span className={`text-[10px] font-bold tracking-tighter uppercase ${isActive ? 'text-white' : 'text-white/40'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <div className="h-screen bg-ghost-black text-[#e0e0e0] font-mono flex flex-col overflow-hidden select-none">
        {/* Tactical Header */}
        <header className="flex justify-between items-end p-4 border-b border-ghost-border bg-ghost-surface/50 backdrop-blur-sm z-30">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-ghost-neon tracking-tighter leading-none flex items-center gap-2">
              GHOST <span className="text-ghost-purple">HUNTERS</span>
            </h1>
            <span className="text-[9px] text-ghost-purple uppercase tracking-[0.3em] font-bold mt-1">
              Tactical Crime-Horror Prevention Interface v4.0.2
            </span>
          </div>
          
          <div className="hidden sm:flex gap-6 text-[10px] items-center uppercase font-bold">
            <div className="flex flex-col items-end">
              <span className="text-[#666]">Status</span>
              <span className="text-ghost-neon">CONNECTED</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#666]">Encryption</span>
              <span className="text-white">AES-256</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/dashboard" element={<PoliceDashboard />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Navigation />
      </div>
    </Router>
  );
}
