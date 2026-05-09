import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, CloudLightning, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// 기본 마커 아이콘 깨짐 방지 (Leaflet + 번들러 이슈 회피)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const spotIcon = (grade: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:-6px;border-radius:9999px;background:${
          grade === 'S' ? 'rgba(255,0,85,0.25)' : 'rgba(0,255,0,0.25)'
        };animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="width:14px;height:14px;transform:rotate(45deg);border:2px solid #000;background:${
          grade === 'S' ? '#ff0055' : '#00ff00'
        };box-shadow:0 0 15px ${grade === 'S' ? '#ff0055' : '#00ff00'};"></div>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const dangerIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,0,85,0.2);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:14px;height:14px;border-radius:9999px;background:#ff0055;box-shadow:0 0 12px #ff0055;"></div>
    </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const myLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(0,255,0,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:12px;height:12px;border-radius:9999px;background:#00ff00;border:2px solid #000;box-shadow:0 0 12px #00ff00;"></div>
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const MapRefBinder: React.FC<{ onReady: (map: L.Map) => void }> = ({ onReady }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
};

const CHANGWON_CENTER: [number, number] = [35.2275, 128.6811];

const Home = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dynamicSpots, setDynamicSpots] = useState<any[]>([]);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 800);

    const fetchData = async () => {
      try {
        const [rankRes, statsRes] = await Promise.all([
          fetch('/api/ranking'),
          fetch('/api/my-stats'),
        ]);
        setRanking(await rankRes.json());
        setMyStats(await statsRes.json());
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      }
    };

    fetchData();
    const loadSpots = () => {
      const spots = JSON.parse(localStorage.getItem('ghost_spots') || '[]');
      setDynamicSpots(spots);
    };
    loadSpots();
    window.addEventListener('storage', loadSpots);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMyPos(coords);
        },
        (err) => {
          console.warn('위치 권한 거부 또는 실패:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', loadSpots);
    };
  }, []);

  const clearData = () => {
    localStorage.removeItem('ghost_spots');
    setDynamicSpots([]);
  };

  const recenterToMe = () => {
    if (myPos && mapRef.current) {
      mapRef.current.flyTo(myPos, 16, { duration: 1.2 });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPos(coords);
        mapRef.current?.flyTo(coords, 16, { duration: 1.2 });
      });
    }
  };

  const initialCenter: [number, number] = myPos ?? CHANGWON_CENTER;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col p-2 gap-4 overflow-y-auto"
    >
      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card bg-ghost-surface border-l-4 border-l-ghost-neon">
          <div className="tactical-label">내 평균 조도 위험 등급</div>
          <div className="text-4xl font-black text-white">{myStats?.averageBrightnessGrade || 'B'}</div>
        </div>
        <div className="bento-card bg-ghost-surface border-l-4 border-l-ghost-blood">
          <div className="tactical-label">총 누적 공포 지수</div>
          <div className="text-4xl font-black text-white">{myStats?.cumulativeScore || 0}</div>
        </div>
      </div>

      {/* 지도 */}
      <div className="relative h-[300px] bg-[#101010] overflow-hidden border-2 border-ghost-border">
        {!mapLoaded && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-ghost-black">
            <Loader2 className="w-12 h-12 text-ghost-neon animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ghost-purple animate-pulse">
              창원 지역 주파수 캘리브레이션 중...
            </p>
          </div>
        )}

        <MapContainer
          center={initialCenter}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
        >
          <MapRefBinder onReady={(m) => (mapRef.current = m)} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={19}
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={19}
          />

          {myPos && (
            <Marker position={myPos} icon={myLocationIcon}>
              <Popup>현재 위치 (수신자)</Popup>
            </Marker>
          )}

          <Marker position={CHANGWON_CENTER} icon={dangerIcon}>
            <Popup>고위험군 상시감시 구역</Popup>
          </Marker>

          {dynamicSpots.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={spotIcon(spot.grade)}
            >
              <Popup>{spot.grade}등급 영체 발견</Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="scan-line absolute inset-0 pointer-events-none z-[400]" />

        <div
          className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-[450]"
          style={{ textShadow: '0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' }}
        >
          <div className="opacity-80">
            <div className="tactical-label !text-[8px]">활성 작전 구역</div>
            <div className="text-xs font-black tracking-tighter uppercase leading-none text-white/90">
              CHANGWON_CITY
            </div>
            <div className="text-[8px] text-ghost-purple/90 italic mt-0.5 font-bold">
              {(myPos ?? CHANGWON_CENTER)[0].toFixed(4)}° N, {(myPos ?? CHANGWON_CENTER)[1].toFixed(4)}° E
            </div>
          </div>

          <div className="opacity-80 flex flex-col items-end">
            <div className="tactical-label !text-[8px]">탐지된 영체 수</div>
            <div className="text-xs font-black text-ghost-neon/90 animate-pulse leading-none uppercase">
              {dynamicSpots.length < 10 ? `0${dynamicSpots.length}` : dynamicSpots.length} ACTIVE
            </div>
          </div>
        </div>

        <button
          onClick={clearData}
          className="absolute bottom-4 left-4 p-2 bg-black/80 border border-ghost-border text-ghost-purple hover:text-ghost-blood transition-colors z-[450]"
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={recenterToMe}
          className="absolute bottom-4 right-4 p-4 rounded-none bg-ghost-black border border-ghost-neon shadow-[0_0_20px_rgba(0,255,0,0.1)] text-ghost-neon active:scale-95 transition-transform z-[450]"
        >
          <CloudLightning size={20} />
        </button>
      </div>

      {/* Ranking */}
      <div className="bento-card flex-1 bg-ghost-surface border border-ghost-border overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="tactical-label">TOP 10 공포 수집가 랭킹</span>
          <span className="text-[10px] text-ghost-neon font-bold animate-pulse">RANKING_REALTIME</span>
        </div>
        <div className="space-y-2 overflow-y-auto">
          {ranking.map((user, idx) => (
            <div key={user.id} className="flex items-center gap-4 p-2 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div className={`w-6 h-6 flex items-center justify-center font-black text-xs ${idx < 3 ? 'text-ghost-neon bg-ghost-neon/20' : 'text-white/50'}`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white tracking-tighter">{user.name}</div>
                <div className="text-[9px] text-white/40 uppercase">Grade: {user.averageBrightnessGrade}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-ghost-blood">{user.cumulativeScore}</div>
                <div className="text-[8px] text-white/30 uppercase">POINTS</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
