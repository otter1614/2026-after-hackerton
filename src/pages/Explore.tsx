import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Scan, Ghost, ShieldAlert, X, ChevronRight, Loader2, RefreshCw, Skull } from 'lucide-react';

const Explore = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isMonsterModal, setIsMonsterModal] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 실시간 카메라 시작
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("카메라 권한 오류:", err);
        setHasPermission(false);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startScan = async () => {
    if (!videoRef.current) return;
    
    setIsScanning(true);

    try {
      // 서버 API 호출 (시뮬레이션 데이터 포함)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brightness: Math.floor(Math.random() * 40), 
          cctvCount: Math.floor(Math.random() * 3),
          populationDensity: Math.random() * 0.3,
          isAbandoned: true,
          crimeStatsWeight: 0.8
        })
      });
      
      const result = await response.json();
      
      // 분석 시간 지연 시뮬레이션
      setTimeout(() => {
        setIsScanning(false);
        const finalResult = {
          ...result,
          address: '경남 창원시 성산구 중앙동 일대',
          threats: ['가로등 조도 부족', '사각지대 노출', '방치된 시설물'],
          ghostName: '창원의 그림자 기사'
        };
        setScanResult(finalResult);

        // 지도용 스팟 저장 (로컬 스토리지 공유)
        const existingSpots = JSON.parse(localStorage.getItem('ghost_spots') || '[]');
        const newSpot = {
          id: Date.now(),
          lat: 35.2275 + (Math.random() - 0.5) * 0.015,
          lng: 128.6811 + (Math.random() - 0.5) * 0.015,
          grade: finalResult.grade,
          risk: finalResult.score
        };
        localStorage.setItem('ghost_spots', JSON.stringify([...existingSpots, newSpot]));
        
        setTimeout(() => setIsMonsterModal(true), 1500);
      }, 3000);

    } catch (error) {
      console.error("분석 오류:", error);
      setIsScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 space-y-6 flex flex-col h-full"
    >
      {/* 상단 정보 */}
      <div className="flex items-center gap-3 bg-ghost-surface border border-ghost-border p-3">
        <MapPin size={18} className="text-ghost-purple shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="tactical-label">현재 작전 지역</div>
          <div className="text-sm font-bold truncate tracking-tighter uppercase">경상남도 창원시 성산구 // 보안 등급: 7</div>
        </div>
      </div>

      {/* 실시간 카메라 프리뷰 */}
      <div className="bento-card !p-2 flex flex-col gap-2 relative">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] bg-ghost-neon text-black px-1 font-bold tracking-tighter">실시간_스캔_채널_01</span>
          <span className="text-[10px] text-ghost-neon flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 bg-ghost-neon rounded-full animate-pulse" />
            LIVE SCANNING
          </span>
        </div>
        
        <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center border border-ghost-border">
          {hasPermission === false ? (
            <div className="text-center p-8">
              <ShieldAlert className="mx-auto text-ghost-blood mb-2" />
              <p className="text-xs text-ghost-blood font-bold">카메라 권한이 거부되었습니다.</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover grayscale opacity-60"
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          {/* 뷰파인더 그래픽 */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, #000, #000 2px, #00ff00 3px)' }} />
          <div className="absolute inset-4 border border-ghost-neon/20 pointer-events-none" />

          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#00ff0011] backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20"
              >
                <div className="scan-line" />
                <h3 className="text-xl font-black tracking-widest text-ghost-neon mb-2">잔류 에너지 분석 중...</h3>
                <div className="text-[10px] font-bold text-white/50 animate-pulse tracking-[0.4em]">DECRYPTING_SIGNATURES</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 스캔 버튼 */}
      {!scanResult && !isScanning && (
        <button 
          onClick={startScan}
          className="w-full py-5 border-2 border-ghost-neon bg-ghost-neon/5 text-ghost-neon font-black uppercase tracking-[0.2em] hover:bg-ghost-neon hover:text-black transition-all mb-4"
        >
          현장 스캔 개시
        </button>
      )}

      {/* 분석 결과 카드 */}
      {scanResult && !isScanning && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bento-card border-l-4 border-l-ghost-neon">
            <div className="tactical-label">혼령 등급</div>
            <div className="text-4xl font-black text-white">{scanResult.grade}-RANK</div>
          </div>
          <div className="bento-card border-l-4 border-l-ghost-blood">
            <div className="tactical-label">위험 수치</div>
            <div className="text-4xl font-black text-white">{scanResult.score}/100</div>
          </div>
          <div className="col-span-2 bento-card">
            <div className="tactical-label">상세 위험 요소 분석</div>
            <div className="space-y-1 mt-2">
              {scanResult.threats.map((threat: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tighter">
                  <span className="w-1.5 h-1.5 bg-ghost-blood" />
                  <span className="text-white/80">{threat}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setScanResult(null); }}
              className="mt-6 w-full border border-ghost-purple py-3 text-[10px] text-ghost-purple font-bold uppercase hover:bg-ghost-purple hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} />
              데이터 캐시 정화
            </button>
          </div>
        </motion.div>
      )}

      {/* 몬스터 출현 모달 */}
      <AnimatePresence>
        {isMonsterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-ghost-black border-4 border-ghost-blood p-8 w-full max-w-md relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-ghost-blood/30 blur-2xl rounded-full" />
                  <Ghost className="w-24 h-24 text-ghost-blood animate-bounce" />
                </div>
                
                <h2 className="text-4xl font-black tracking-tighter text-white uppercase glitch mb-2">실체 확인됨!</h2>
                <p className="text-sm font-bold text-ghost-blood uppercase tracking-widest mb-6">등록되지 않은 영적 존재가 감지되었습니다</p>
                
                <div className="w-full bg-ghost-blood/10 border border-ghost-blood/30 p-4 mb-8 flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-black flex items-center justify-center flex-shrink-0 border border-ghost-blood/50">
                    <Skull className="text-ghost-blood animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] text-ghost-blood font-bold uppercase">개체 식별 코드</div>
                    <div className="text-lg font-black tracking-tight text-white">{scanResult?.ghostName || '정보 없음'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setIsMonsterModal(false)}
                    className="py-4 bg-white text-black font-black uppercase tracking-tight active:scale-95 transition-transform"
                  >
                    제령하기
                  </button>
                  <button 
                    onClick={() => setIsMonsterModal(false)}
                    className="py-4 bg-ghost-blood text-white font-black uppercase tracking-tight active:scale-95 transition-transform"
                  >
                    회피하기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Explore;
