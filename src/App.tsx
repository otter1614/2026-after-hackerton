import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Map as MapIcon, Camera, Trophy, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Ranking from './pages/Ranking';
import PoliceDashboard from './pages/PoliceDashboard';
import Alternate from './pages/Alternate';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: '홈 (지도)', icon: MapIcon },
    { path: '/explore', name: '탐험 (카메라)', icon: Camera },
    { path: '/ranking', name: '랭킹', icon: Trophy },
    { path: '/dashboard', name: '대시보드', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-ghost-surface/95 border-t border-ghost-border/70 z-40 backdrop-blur-xl">
      <div className="flex max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all border-t-2 relative ${
                isActive 
                  ? 'border-ghost-crimson bg-ghost-ember/10 shadow-[0_-10px_20px_rgba(217,63,79,0.15)]' 
                  : 'border-white/10 hover:border-ghost-crimson/60'
              }`}
            >
              <div className={`w-2 h-2 absolute top-1 left-1 ${isActive ? 'bg-ghost-crimson' : 'bg-white/10'}`} />
              <item.icon size={18} className={isActive ? 'text-ghost-crimson' : 'text-white/40'} />
              <span className={`text-[10px] font-bold tracking-tighter uppercase ${isActive ? 'text-ghost-cream' : 'text-white/40'}`}>
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
      <div className="relative h-screen overflow-hidden text-ghost-cream font-mono select-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(170,32,41,0.14),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(22,9,10,0.18),transparent_16%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_28%)] mix-blend-screen" />
        <div className="relative h-full flex flex-col bg-[#050304] bg-[radial-gradient(circle_at_top,_rgba(126,24,36,0.08),transparent_26%),linear-gradient(180deg,#060405_0%,#040204_48%,#090708_100%)]">
          <header className="flex flex-col sm:flex-row justify-between items-start gap-4 p-5 border-b border-[#3f1017]/70 bg-[#0c0608]/95 backdrop-blur-xl z-20">
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black text-ghost-cream tracking-[0.02em] leading-none flex flex-col sm:flex-row gap-1">
                <span className="text-[#b84a55]">귀신을</span>
                <span className="text-ghost-cream">잡아라</span>
              </h1>
              <span className="text-[9px] text-ghost-cream/70 uppercase tracking-[0.4em] font-bold mt-2">
                심야 관제 시스템 v4.0.2
              </span>
            </div>

            <div className="hidden sm:flex gap-6 text-[10px] items-center uppercase font-bold">
              <div className="flex flex-col items-end">
                <span className="text-ghost-cream/70">Status</span>
                <span className="text-[#df9c9e]">ACTIVE</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-ghost-cream/70">Encryption</span>
                <span className="text-ghost-cream">AES-256</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-16 relative">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/alternate" element={<Alternate />} />
                <Route path="/dashboard" element={<PoliceDashboard />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Navigation />
        </div>
      </div>
    </Router>
  );
}
