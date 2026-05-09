import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Skull, Ghost, Zap } from 'lucide-react';

const Ranking = () => {
  const leaderboards = [
    { id: 1, name: '스펙트럼바이퍼', level: 42, points: 12450, grade: 'S' },
    { id: 2, name: '나이트크롤러', level: 38, points: 9820, grade: 'S' },
    { id: 3, name: '고스트아이', level: 35, points: 8540, grade: 'A' },
    { id: 4, name: '네온섀도우', level: 31, points: 7200, grade: 'A' },
    { id: 5, name: '진용사', level: 28, points: 6100, grade: 'B' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 space-y-6"
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black tracking-tighter text-ghost-neon uppercase leading-none mb-1">
          최정예 헌터 랭킹
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-[1px] bg-ghost-purple" />
          <p className="text-[10px] font-bold text-ghost-purple uppercase tracking-[0.4em]">Hunter Records v4</p>
          <div className="w-8 h-[1px] bg-ghost-purple" />
        </div>
      </div>

      <div className="space-y-4">
        {leaderboards.map((user, idx) => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bento-card flex items-center gap-4 relative ${
              idx === 0 ? 'border-2 border-ghost-neon bg-ghost-neon/5' : ''
            }`}
          >
            <div className={`text-xl font-black w-8 ${idx === 0 ? 'text-ghost-neon' : 'text-[#666]'}`}>
              {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg tracking-tighter uppercase truncate leading-none mb-1 text-white">
                {user.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#666]">
                <span className="text-ghost-neon uppercase">LVL {user.level}</span>
                <span className="w-1 h-1 bg-[#333] rounded-full" />
                <span>{user.points.toLocaleString()} PTS</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-white italic leading-none">{user.grade}</div>
              <div className="tactical-label !mb-0">등급</div>
            </div>

            {idx === 0 && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-ghost-neon text-black text-[9px] font-black uppercase tracking-tighter">
                CHAMPION
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* User Stats Card (Bento Style) */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bento-card border-ghost-purple/50">
          <span className="tactical-label">전 세계 순위</span>
          <div className="text-3xl font-black text-white">#1,245</div>
        </div>
        <div className="bento-card border-ghost-purple/50">
          <span className="tactical-label">보유 C-코인</span>
          <div className="text-3xl font-black text-white">2,450</div>
        </div>
      </div>
    </motion.div>
  );
};

export default Ranking;
