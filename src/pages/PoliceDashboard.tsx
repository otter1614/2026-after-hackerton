import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, AlertCircle, ShieldCheck, Map, ArrowRight, ListFilter, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PoliceDashboard = () => {
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">
            경찰 통합 관제 대시보드
          </h2>
          <span className="text-[9px] text-[#666] font-bold uppercase tracking-[0.2em] mt-1">Central Intelligence Hub - 창원 본부</span>
        </div>
        <div className="px-3 py-1 bg-ghost-neon text-black font-black text-[9px] uppercase tracking-tighter animate-pulse">
            실시간 데이터 피드
        </div>
      </div>

      {/* High Level Stats (Bento Row) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card border-l-4 border-l-ghost-purple">
          <div className="tactical-label">활성 헌터 수</div>
          <div className="text-3xl font-black text-white">1,245</div>
        </div>
        <div className="bento-card border-l-4 border-l-ghost-neon">
          <div className="tactical-label">위험 요소 동기화</div>
          <div className="text-3xl font-black text-white">34</div>
        </div>
      </div>

      {/* Chart Visualization (Bento Style) */}
      <div className="bento-card">
        <div className="flex justify-between items-center mb-6">
          <span className="tactical-label">행정구역별 위험지수 분석</span>
          <span className="text-[10px] font-bold text-ghost-neon tracking-tighter uppercase font-mono">NODE: CHANGWON-RE-42</span>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={9} stroke="#3a0066" tick={{ fill: '#666' }} />
              <YAxis fontSize={9} stroke="#3a0066" tick={{ fill: '#666' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#050505', border: '1px solid #3a0066', fontSize: '10px', borderRadius: '0' }}
                cursor={{ fill: '#3a006620' }}
              />
              <Bar dataKey="risk" radius={[0, 0, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.risk > 80 ? '#ff0055' : '#00ff00'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Patrol List */}
      <div className="space-y-4">
        <h3 className="tactical-label">최우선 순찰 대응 구역</h3>
        
        <div className="space-y-3">
          {priorityHotspots.map((spot) => (
            <motion.div 
              key={spot.id}
              whileHover={{ scale: 1.01 }}
              className={`bento-card !border-l-4 ${
                spot.risk > 90 ? 'border-l-ghost-blood' : 'border-l-ghost-purple'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-black text-sm uppercase tracking-tighter text-white">{spot.area}</span>
                <span className={`text-[10px] font-black ${spot.risk > 90 ? 'text-ghost-blood' : 'text-ghost-purple'}`}>
                  {spot.risk}% 위험도
                </span>
              </div>
              <p className="text-[9px] font-bold text-[#666] uppercase mb-3 leading-tight font-mono">{spot.reason}</p>
              <div className="flex justify-between items-center pt-2 border-t border-ghost-border/30">
                <div className="text-[9px] font-bold text-ghost-neon tracking-widest uppercase">
                  커뮤니티 제보: {spot.reports}건
                </div>
                <button className="text-[9px] font-black border border-ghost-neon px-2 py-0.5 text-ghost-neon uppercase tracking-tighter hover:bg-ghost-neon hover:text-black transition-all">
                    상세 데이터_열람
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Simulation Toggle */}
      <div className="bg-blue-600/10 border border-blue-500/30 p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">긴급 브로드캐스트</span>
          <span className="text-[9px] text-blue-400/60 font-bold uppercase mt-1">현장 순찰 유닛과 실시간 데이터 공유</span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-tighter">
            전송 개시
        </button>
      </div>
    </motion.div>
  );
};

export default PoliceDashboard;
