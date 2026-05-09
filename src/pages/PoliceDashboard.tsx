import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShieldCheck, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: '창원 성산', risk: 85 },
  { name: '창원 마산', risk: 72 },
  { name: '창원 진해', risk: 68 },
  { name: '의창구', risk: 94 },
  { name: '대구 수성', risk: 78 },
];

const priorityHotspots = [
  { id: 1, area: '의창구 중앙대로 사거리', risk: 94, reason: '조명 시설 노후화 + 높은 범죄 통계', reports: 12 },
  { id: 2, area: '성산구 상남동 상가밀집지역', risk: 85, reason: '사각지대 다수 + CCTV 미설치 구역', reports: 8 },
  { id: 3, area: '진해구 경화역 인근 철길', risk: 78, reason: '장기 방치 시설물 존재', reports: 15 },
];

const PoliceDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 space-y-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(192,64,74,0.14),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(24,10,12,0.4),transparent_35%)] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-[0.02em] text-ghost-cream uppercase leading-tight">
              경찰 통합 관제 대시보드
            </h2>
            <span className="text-[9px] text-ghost-cream/70 font-bold uppercase tracking-[0.2em] mt-1 block">
              Central Intelligence Hub - 창원 본부
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#6d1a23] text-[#f5d2d2] font-black text-[9px] uppercase tracking-tighter animate-pulse border border-[#8f2f3d]/30">
            실시간 데이터 피드
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bento-card border-l-4 border-l-[#7f1d25] bg-[#0b0709]/95">
            <div className="tactical-label">활성 헌터 수</div>
            <div className="text-3xl font-black text-ghost-cream">1,245</div>
          </div>
          <div className="bento-card border-l-4 border-l-[#7f1d25] bg-[#0b0709]/95">
            <div className="tactical-label">위험 요소 동기화</div>
            <div className="text-3xl font-black text-ghost-cream">34</div>
          </div>
        </div>

        <div className="bento-card bg-[#0a0608]/95 border border-[#351013] shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <span className="tactical-label">행정구역별 위험지수 분석</span>
            <span className="text-[10px] font-bold text-ghost-cream tracking-tighter uppercase font-mono">NODE: CHANGWON-RE-42</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" fontSize={9} stroke="#4d1118" tick={{ fill: '#b9b9b9' }} />
                <YAxis fontSize={9} stroke="#4d1118" tick={{ fill: '#b9b9b9' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090607', border: '1px solid #4d1118', fontSize: '10px', borderRadius: '0' }}
                  cursor={{ fill: 'rgba(184,69,77,0.18)' }}
                />
                <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 80 ? '#a9414f' : '#5d151f'} fillOpacity={0.94} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="tactical-label">최우선 순찰 대응 구역</h3>
          <div className="space-y-3">
            {priorityHotspots.map((spot) => (
              <motion.div
                key={spot.id}
                whileHover={{ scale: 1.01 }}
                className={`bento-card bg-[#0b0709]/95 border border-[#311014] !border-l-4 ${spot.risk > 90 ? 'border-l-[#bc5b67]' : 'border-l-[#6f1c25]'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-sm uppercase tracking-tighter text-[#f4d5d3]">{spot.area}</span>
                  <span className={`text-[10px] font-black ${spot.risk > 90 ? 'text-[#c56a72]' : 'text-[#ad5d64]'}`}>
                    {spot.risk}% 위험도
                  </span>
                </div>
                <p className="text-[9px] text-[#9a9a9a] uppercase mb-3 leading-tight font-mono">{spot.reason}</p>
                <div className="flex justify-between items-center pt-3 border-t border-[#2d141a]/30">
                  <div className="text-[9px] font-bold text-ghost-cream tracking-widest uppercase">
                    커뮤니티 제보: {spot.reports}건
                  </div>
                  <button className="text-[9px] font-black border border-[#7f1d25] px-2 py-0.5 text-[#dfc3c5] uppercase tracking-tighter hover:bg-[#7f1d25]/15 hover:text-[#fff1f1] transition-all">
                    상세 데이터_열람
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="ghost-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b0708]/95 border border-[#36131c]">
          <div>
            <span className="text-xs font-bold text-ghost-cream uppercase tracking-tighter">긴급 브로드캐스트</span>
            <span className="text-[9px] text-ghost-cream/70 font-bold uppercase mt-1 block">현장 순찰 유닛과 실시간 데이터 공유</span>
          </div>
          <button className="ghost-button bg-[#6f1720] border-[#8f1e29] px-6 py-3 text-[#f5d4d5] hover:bg-[#8c1e2a]/95">
            전송 개시
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PoliceDashboard;
