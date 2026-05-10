import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ShieldCheck, Monitor, BarChart2, ArrowRight } from 'lucide-react';

const alternateTargets = [
  { label: '남부 폐공장', threat: 'CRITICAL', level: 'S+', status: 'LOCKED' },
  { label: '해변 첨탑', threat: 'HIGH', level: 'A', status: 'TRACKING' },
  { label: '중앙 묘지', threat: 'MEDIUM', level: 'B', status: 'MONITOR' },
];

export default function Alternate() {
  return (
    <div className="min-h-full bg-[#060e12] text-[#cdf5d4] font-mono p-5 pb-28 space-y-6 overflow-hidden">
      <section className="rounded-[32px] border border-[#3d7b64] bg-[#0a1915]/95 shadow-[0_35px_90px_rgba(0,0,0,0.55)] p-6 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-[#76e3b1]/20 bg-[#76e3b1]/10 text-[#b7f1cd] uppercase tracking-[0.35em] text-[11px] font-black">
              <Ghost size={16} /> archived mode
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-[0.04em]">Spectral Archive</h1>
            <p className="max-w-2xl text-sm text-[#b9e6c8]/90 leading-relaxed">
              이 버전은 고스트 헌터의 클래식 콘솔 감시 화면입니다. 빠른 요약과 침입 경보를 직관적으로 보여줍니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center">
            {[
              { label: '대상', value: '3', icon: Monitor },
              { label: '경보', value: '12', icon: ShieldCheck },
              { label: '위험', value: 'S+', icon: BarChart2 },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-[#3d7b64] bg-[#09110f]/85 p-4">
                <item.icon className="mx-auto mb-3 text-[#76e3b1]" size={24} />
                <div className="text-3xl font-black tracking-tight">{item.value}</div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-[#cdf5d4]/80 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[#3d7b64] bg-[#081310]/95 shadow-[0_30px_80px_rgba(0,0,0,0.5)] p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[#b9e6c8]/70 font-semibold">실시간 스캔</div>
              <h2 className="text-3xl font-black tracking-tighter mt-2">Ghost radar feed</h2>
            </div>
            <span className="rounded-full bg-[#2f6b52] px-3 py-1 text-[10px] uppercase tracking-[0.4em] font-bold text-[#d5f9dd]">
              04:12:58
            </span>
          </div>
          <div className="grid gap-3">
            {alternateTargets.map((target) => (
              <div key={target.label} className="rounded-3xl border border-[#1b3b2c] bg-[#0c1a16]/90 p-4 hover:bg-[#12261d]/95 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.3em] text-[#cdf5d4]/75">{target.label}</div>
                    <div className="text-lg font-black text-[#e5f9e6] mt-1">{target.threat}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.35em] text-[#b7f1cd] bg-[#16563f]/20 rounded-full px-3 py-1">
                    {target.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-[#b7f1cd]/80">
                  <span>Classification: {target.level}</span>
                  <span>Signal: {target.status === 'LOCKED' ? '99%' : '73%'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#3d7b64] bg-[#07110f]/95 shadow-[0_30px_80px_rgba(0,0,0,0.5)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-[#76e3b1]/10 p-3 text-[#76e3b1]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[#b9e6c8]/80">내부 경보</div>
              <h3 className="text-2xl font-black">Security matrix</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[#1c3c2b] bg-[#0b1712]/95 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-[#cdf5d4] uppercase tracking-[0.3em] mb-3">
                <span>Power baseline</span>
                <span>86%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1e4330] overflow-hidden">
                <div className="h-full w-[86%] rounded-full bg-[#76e3b1]" />
              </div>
            </div>

            <div className="rounded-3xl border border-[#1c3c2b] bg-[#0b1712]/95 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-[#cdf5d4] uppercase tracking-[0.3em] mb-3">
                <span>Entity latency</span>
                <span>28 ms</span>
              </div>
              <div className="h-2 rounded-full bg-[#1e4330] overflow-hidden">
                <div className="h-full w-[28%] rounded-full bg-[#76e3b1]" />
              </div>
            </div>

            <div className="rounded-3xl border border-[#1c3c2b] bg-[#0b1712]/95 p-4">
              <div className="text-sm font-bold text-[#cdf5d4] uppercase tracking-[0.3em] mb-3">Echo waveform</div>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className={`h-8 rounded-full ${idx % 3 === 0 ? 'bg-[#76e3b1]' : 'bg-[#144731]'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#3d7b64] bg-[#081310]/95 p-6 shadow-[0_35px_90px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#b9e6c8]/80">mode</div>
            <h2 className="text-3xl font-black tracking-tight mt-2">Retro detection console</h2>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#76e3b1]/30 bg-[#76e3b1]/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.28em] text-[#cdf5d4] hover:bg-[#76e3b1]/15 transition-all"
          >
            메인 UI로 돌아가기
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {['GRID ██', 'SENSOR ██', 'NODE ██'].map((label) => (
            <div key={label} className="rounded-3xl border border-[#1c3c2b] bg-[#0b1712]/95 p-4">
              <div className="text-[10px] uppercase tracking-[0.35em] text-[#b9e6c8]/75 mb-2">{label}</div>
              <div className="text-2xl font-black text-[#e5f9e6]">{Math.floor(Math.random() * 100 + 1)}%</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
