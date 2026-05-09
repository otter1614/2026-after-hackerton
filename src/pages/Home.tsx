import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Skull, AlertTriangle, CloudLightning, RefreshCw } from 'lucide-react';

const Home = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dynamicSpots, setDynamicSpots] = useState<any[]>([]);

  // 초기 데이터 로드 및 로컬 스토리지 감시
  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 1500);
    
    const loadSpots = () => {
      const spots = JSON.parse(localStorage.getItem('ghost_spots') || '[]');
      setDynamicSpots(spots);
    };

    loadSpots();
    
    // 다른 탭/페이지에서 변경 시 감지
    window.addEventListener('storage', loadSpots);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', loadSpots);
    };
  }, []);

  const clearData = () => {
    localStorage.removeItem('ghost_spots');
    setDynamicSpots([]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 지도 컨테이너 (창원 중심 시뮬레이션) */}
      <div className="relative flex-1 bg-[#101010] overflow-hidden border-2 border-ghost-border m-2">
        {!mapLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ghost-black">
            <Loader2 className="w-12 h-12 text-ghost-neon animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ghost-purple animate-pulse">
              창원 지역 주파수 캘리브레이션 중...
            </p>
          </div>
        )}
        
        {/* 그리드 및 배경효과 */}
        <div 
          className="absolute inset-0 opacity-40 grayscale contrast-150 brightness-50"
          style={{
            backgroundImage: `radial-gradient(#222 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-ghost-purple/5 rounded-full blur-[100px] animate-pulse" />

        {/* 택티컬 스캔 라인 */}
        <div className="scan-line" />

        {/* 동적 고스트 스팟 (사용자가 직접 찍은 데이터) */}
        {mapLoaded && dynamicSpots.map((spot) => (
          <motion.div 
            key={spot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute flex flex-col items-center group cursor-pointer z-10"
            style={{ 
                top: `${((spot.lat - 35.21) / 0.03) * 100}%`, 
                left: `${((spot.lng - 128.66) / 0.04) * 100}%` 
            }}
          >
            <div className={`w-4 h-4 rotate-45 border-2 border-black ${spot.grade === 'S' ? 'bg-ghost-blood shadow-[0_0_15px_#ff0055]' : 'bg-ghost-neon shadow-[0_0_15px_#00ff00]'}`} />
            <div className="absolute -inset-2 bg-ghost-neon/20 rounded-full animate-ping pointer-events-none" />
            <span className="text-[8px] bg-black px-1 mt-1 border border-ghost-border text-white whitespace-nowrap font-bold">
              {spot.grade}등급 영체 발견
            </span>
          </motion.div>
        ))}

        {/* 고정된 기본 위험 지역 (창원 시청 인근 시뮬레이션) */}
        {mapLoaded && (
          <motion.div 
            className="absolute top-[45%] left-[52%] flex flex-col items-center z-5"
          >
            <div className="w-6 h-6 bg-ghost-blood/20 rounded-full animate-ping opacity-30" />
            <div className="w-3 h-3 bg-ghost-blood rounded-full absolute top-1.5" />
            <span className="text-[9px] bg-black px-1 mt-1 border border-ghost-blood text-ghost-blood uppercase font-bold">고위험군_상시감시</span>
          </motion.div>
        )}

        {/* 지도 HUD 오버레이 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-30">
          <div className="bg-black/80 border border-ghost-border p-3 backdrop-blur-md">
            <div className="tactical-label">활성 작전 구역</div>
            <div className="text-lg font-black tracking-tighter uppercase leading-none text-white">CHANGWON_CITY_MAIN</div>
            <div className="text-[9px] text-ghost-purple italic mt-1 font-bold">좌표: 35.2275° N, 128.6811° E</div>
          </div>
          
          <div className="bg-black/80 border border-ghost-border p-3 backdrop-blur-md flex flex-col items-end">
            <div className="tactical-label">탐지된 영체 수</div>
            <div className="text-lg font-black text-ghost-neon animate-pulse leading-none uppercase">
                {dynamicSpots.length < 10 ? `0${dynamicSpots.length}` : dynamicSpots.length} ACTIVE
            </div>
          </div>
        </div>

        {/* 데이터 초기화 버튼 */}
        <button 
          onClick={clearData}
          className="absolute bottom-4 left-4 p-2 bg-black/80 border border-ghost-border text-ghost-purple hover:text-ghost-blood transition-colors z-40"
        >
          <RefreshCw size={14} />
        </button>

        {/* 내 위치 중심 버튼 */}
        <button className="absolute bottom-4 right-4 p-4 rounded-none bg-ghost-black border border-ghost-neon shadow-[0_0_20px_rgba(0,255,0,0.1)] text-ghost-neon active:scale-95 transition-transform z-40">
          <CloudLightning size={20} />
        </button>
      </div>
      
      {/* 하단 상태 바 (Bento Style) */}
      <div className="h-24 grid grid-cols-4 gap-2 px-2 pb-2">
        <div className="bento-card flex flex-col justify-center">
          <span className="tactical-label">지역 범죄 지수</span>
          <span className="text-xl font-black text-ghost-neon tracking-tighter">84.2%</span>
        </div>
        <div className="bento-card flex flex-col justify-center">
          <span className="tactical-label">평균 조도</span>
          <span className="text-xl font-black text-ghost-neon tracking-tighter">12 LUX</span>
        </div>
        <div className="bento-card flex flex-col justify-center">
          <span className="tactical-label">CCTV 밀도</span>
          <span className="text-lg font-black text-white uppercase tracking-tighter">낮음</span>
        </div>
        <div className="bento-card flex flex-col justify-center">
          <span className="tactical-label">위험 등급</span>
          <span className="text-xl font-black text-ghost-blood tracking-tighter">S-위험</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
