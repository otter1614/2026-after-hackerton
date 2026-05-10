import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Scan, Ghost, ShieldAlert, X, ChevronRight, Loader2, RefreshCw, Skull } from 'lucide-react';

const Explore = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isMonsterModal, setIsMonsterModal] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('위치 확인 중...');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 위치 → 역지오코딩 (OSM Nominatim, 키 불필요)
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentArea('위치 서비스 미지원');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ko&zoom=14`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const a = data.address ?? {};
          const parts = [
            a.province ?? a.state,
            a.city ?? a.county,
            a.borough ?? a.suburb ?? a.city_district,
            a.neighbourhood ?? a.quarter ?? a.village,
          ].filter(Boolean);
          setCurrentArea(parts.length ? parts.join(' ') : (data.display_name ?? '위치 식별 실패'));
        } catch (err) {
          console.warn('역지오코딩 실패:', err);
          setCurrentArea(`좌표: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      (err) => {
        console.warn('위치 권한 실패:', err.message);
        setCurrentArea('위치 권한 거부됨');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 즉시 미리보기 (스캐닝 박스에 표시)
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanResult(null);

    try {
      // 현재 위치 + 주소 수집 (실패 시 null)
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      let resolvedAddress: string | null = null;
      if (coords) {
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=ko&zoom=16`
          );
          if (geo.ok) {
            const g = await geo.json();
            const a = g.address ?? {};
            const parts = [
              a.province ?? a.state,
              a.city ?? a.county,
              a.borough ?? a.suburb ?? a.city_district,
              a.neighbourhood ?? a.quarter ?? a.village,
              a.road,
            ].filter(Boolean);
            resolvedAddress = parts.length ? parts.join(' ') : (g.display_name ?? null);
          }
        } catch {}
      }

      const formData = new FormData();
      formData.append('photo', file);
      if (coords) {
        formData.append('lat', String(coords.lat));
        formData.append('lng', String(coords.lng));
      }
      if (resolvedAddress) formData.append('address', resolvedAddress);

      const response = await fetch('/api/analyze-horror', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      setIsScanning(false);
      setScanResult({
        ...result,
        ghostName: '공포의 잔영',
      });

      const existingSpots = JSON.parse(localStorage.getItem('ghost_spots') || '[]');
      const newSpot = {
        id: Date.now(),
        lat: coords?.lat ?? 35.2275 + (Math.random() - 0.5) * 0.015,
        lng: coords?.lng ?? 128.6811 + (Math.random() - 0.5) * 0.015,
        grade: result.horrorGrade ?? 'B',
        risk: result.horrorScore ?? 0,
      };
      localStorage.setItem('ghost_spots', JSON.stringify([...existingSpots, newSpot]));
      // 모달 자동 표시 X — 사용자가 버튼 눌러야 뜸
    } catch (error) {
      console.error('분석 오류:', error);
      setIsScanning(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startScan = async () => {
    if (!videoRef.current) return;

    setPhotoPreview(null);
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
      <div className="ghost-panel flex items-center gap-3">
        <MapPin size={18} className="text-ghost-crimson shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="tactical-label">현재 작전 지역</div>
          <div className="text-sm font-bold truncate tracking-tighter uppercase">{currentArea}</div>
        </div>
      </div>

      {/* 실시간 카메라 프리뷰 */}
      <div className="bento-card !p-2 flex flex-col gap-2 relative">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] bg-ghost-crimson text-black px-1 font-bold tracking-tighter">실시간_스캔_채널_01</span>
          <span className="text-[10px] text-ghost-crimson flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 bg-ghost-crimson rounded-full animate-pulse" />
            LIVE SCANNING
          </span>
        </div>
        
        <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center border border-ghost-border">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="업로드된 사진"
              className="w-full h-full object-cover grayscale contrast-125 opacity-80"
            />
          ) : hasPermission === false ? (
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
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, #000, #000 2px, rgba(217,63,79,0.1) 3px)' }} />
          <div className="absolute inset-4 border border-ghost-crimson/20 pointer-events-none" />

          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ghost-blood/10 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20"
              >
                <div className="scan-line" />
                <h3 className="text-xl font-black tracking-widest text-ghost-cream mb-2">잔류 에너지 분석 중...</h3>
                <div className="text-[10px] font-bold text-white/50 animate-pulse tracking-[0.4em]">DECRYPTING_SIGNATURES</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 스캔 버튼 */}
      {!scanResult && !isScanning && (
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={startScan}
            className="w-full py-5 border-2 border-ghost-neon bg-ghost-neon/5 text-ghost-neon font-black uppercase tracking-[0.2em] hover:bg-ghost-neon hover:text-black transition-all"
          >
            현장 스캔 개시
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-ghost-purple bg-ghost-purple/5 text-ghost-purple font-bold uppercase tracking-[0.1em] hover:bg-ghost-purple hover:text-black transition-all"
          >
            사진 업로드 분석
          </button>
        </div>
      )}

      {/* 분석 결과 카드 */}
      {scanResult && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          {scanResult.scores ? (
            // 사진 업로드 — Horror 분석 결과
            <>
              <div className="bento-card border-l-4 border-l-ghost-blood">
                <div className="tactical-label">공포 등급</div>
                <div className="text-4xl font-black text-white">{scanResult.horrorGrade}-RANK</div>
                <div className="text-xs text-ghost-blood mt-1">공포 {scanResult.horrorScore}/100</div>
              </div>
              <div className="bento-card border-l-4 border-l-ghost-neon">
                <div className="tactical-label">위험 수치</div>
                <div className="text-4xl font-black text-white">{scanResult.dangerScore}<span className="text-xs text-ghost-neon">/100</span></div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">조도</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.brightness} pts</div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">폐건물</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.abandoned} pts</div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">낙서</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.graffiti} pts</div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">유동인구 부족</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.lowPopulation} pts</div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">음산함</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.eerieEnvironment} pts</div>
              </div>
              <div className="bento-card">
                <div className="tactical-label">구조 위험</div>
                <div className="text-xl font-bold text-white">{scanResult.scores.structuralHazard} pts</div>
              </div>
              {scanResult.scores.rationale && (
                <div className="col-span-2 bento-card">
                  <div className="tactical-label">AI 분석 근거</div>
                  <div className="text-[11px] text-white/80 leading-relaxed mt-1">{scanResult.scores.rationale}</div>
                  {scanResult.source === 'fallback' && (
                    <div className="text-[9px] text-ghost-purple mt-2 uppercase tracking-widest">⚠ AI 폴백 모드 (더미 점수)</div>
                  )}
                </div>
              )}
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsMonsterModal(true)}
                  className="py-4 bg-ghost-blood text-white font-black uppercase tracking-tight active:scale-95 transition-transform"
                >
                  사냥 개시
                </button>
                <button
                  onClick={() => { setScanResult(null); setPhotoPreview(null); }}
                  className="py-4 border border-ghost-purple text-ghost-purple font-bold uppercase tracking-tight hover:bg-ghost-purple hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  초기화
                </button>
              </div>
            </>
          ) : (
            // 카메라 스캔 — 기존 로직
            <>
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
            </>
          )}
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
