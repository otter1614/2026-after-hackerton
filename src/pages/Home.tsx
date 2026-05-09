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

// 택티컬 다이아몬드 마커 (동적 스팟용)
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

// 고위험 고정 마커 (창원시청 인근)
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

// 내 위치 펄스 마커
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

// 외부에서 ref로 지도 제어하기 위한 헬퍼
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

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 800);

    const loadSpots = () => {
      const spots = JSON.parse(localStorage.getItem('ghost_spots') || '[]');
      setDynamicSpots(spots);
    };
    loadSpots();
    window.addEventListener('storage', loadSpots);

    // 현재 위치 가져오기
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
      className="h-full flex flex-col"
    >
      <div className="relative flex-1 bg-[#101010] overflow-hidden border-2 border-ghost-border m-2">
        {!mapLoaded && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-ghost-black">
            <Loader2 className="w-12 h-12 text-ghost-neon animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ghost-purple animate-pulse">
              창원 지역 주파수 캘리브레이션 중...
            </p>
          </div>
        )}

        {/* 실제 Leaflet 지도 */}
        <MapContainer
          center={initialCenter}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
        >
          <MapRefBinder onReady={(m) => (mapRef.current = m)} />
          {/* CartoDB Dark Matter 다크 타일 (무료) */}
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

          {/* 내 위치 */}
          {myPos && (
            <Marker position={myPos} icon={myLocationIcon}>
              <Popup>현재 위치 (수신자)</Popup>
            </Marker>
          )}

          {/* 고정 위험 지역 */}
          <Marker position={CHANGWON_CENTER} icon={dangerIcon}>
            <Popup>고위험군 상시감시 구역</Popup>
          </Marker>

          {/* 동적 고스트 스팟 */}
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

        {/* 스캔라인 + HUD 오버레이 (지도 위) */}
        <div className="scan-line absolute inset-0 pointer-events-none z-[400]" />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-[450]">
          <div className="bg-black/80 border border-ghost-border p-3 backdrop-blur-md">
            <div className="tactical-label">활성 작전 구역</div>
            <div className="text-lg font-black tracking-tighter uppercase leading-none text-white">
              CHANGWON_CITY_MAIN
            </div>
            <div className="text-[9px] text-ghost-purple italic mt-1 font-bold">
              좌표: {(myPos ?? CHANGWON_CENTER)[0].toFixed(4)}° N,{' '}
              {(myPos ?? CHANGWON_CENTER)[1].toFixed(4)}° E
            </div>
          </div>

          <div className="bg-black/80 border border-ghost-border p-3 backdrop-blur-md flex flex-col items-end">
            <div className="tactical-label">탐지된 영체 수</div>
            <div className="text-lg font-black text-ghost-neon animate-pulse leading-none uppercase">
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
