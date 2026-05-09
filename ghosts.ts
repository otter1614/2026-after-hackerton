// 창원 행정구 단위 범죄밀도 (대표값 — 공개 통계 기반 추정치)
// 정확한 수치가 필요하면 data.go.kr 행정구별 범죄통계 API로 교체
export interface District {
  name: string;
  center: [number, number]; // [lat, lng]
  radius: number;           // 영체 스폰 반경(도)
  crimeDensity: number;     // 0-100
  dominantCrime: string;
}

export const CHANGWON_DISTRICTS: District[] = [
  { name: '의창구',     center: [35.2538, 128.6406], radius: 0.025, crimeDensity: 78, dominantCrime: '절도' },
  { name: '성산구',     center: [35.2241, 128.6794], radius: 0.025, crimeDensity: 85, dominantCrime: '폭행' },
  { name: '마산합포구', center: [35.2096, 128.5704], radius: 0.030, crimeDensity: 72, dominantCrime: '절도' },
  { name: '마산회원구', center: [35.2189, 128.5816], radius: 0.025, crimeDensity: 68, dominantCrime: '강도' },
  { name: '진해구',     center: [35.1379, 128.6843], radius: 0.030, crimeDensity: 65, dominantCrime: '폭행' },
];

// 창원폴리텍대학 (경상남도 창원시 의창구 봉림로 53) — 영체 실제 스폰 중심점
// district 필드는 등급/HP/ATK 계산용 밀도 출처 라벨로만 의미를 가짐
const POLYTECH_CENTER: [number, number] = [35.2540, 128.6748];
const POLYTECH_MIN_R = 0.0015; // 약 ~150m
const POLYTECH_MAX_R = 0.0080; // 약 ~800m

function spawnNearPolytech(): [number, number] {
  const r = POLYTECH_MIN_R + Math.random() * (POLYTECH_MAX_R - POLYTECH_MIN_R);
  const theta = Math.random() * Math.PI * 2;
  return [
    POLYTECH_CENTER[0] + r * Math.cos(theta),
    POLYTECH_CENTER[1] + r * Math.sin(theta),
  ];
}

const GHOST_NAME_POOL = [
  '창원의 그림자 기사',
  '폐선의 망령',
  '심야 무전기 영혼',
  '재개발의 잔향',
  '해안 창고의 한기',
  '농로 위의 백발',
  '지하주차장의 고독',
  '낙서의 광인',
  '구 도심의 흐느낌',
  '폐공장의 굴뚝귀',
  '심야 경적의 잔흔',
  '가로등 아래 그늘',
];

export interface Ghost {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  crimeType: string;
  density: number;     // 출처 행정구의 범죄밀도
  grade: 'S' | 'A' | 'B' | 'C';
  hp: number;
  atk: number;
  spawnedAt: string;
}

function pickWeightedDistrict(): District {
  // 밀도 가중 랜덤 선택 (밀도 높은 구가 더 자주 등장)
  const total = CHANGWON_DISTRICTS.reduce((s, d) => s + d.crimeDensity, 0);
  let r = Math.random() * total;
  for (const d of CHANGWON_DISTRICTS) {
    r -= d.crimeDensity;
    if (r <= 0) return d;
  }
  return CHANGWON_DISTRICTS[0];
}

function gradeFromDensity(density: number): 'S' | 'A' | 'B' | 'C' {
  if (density >= 80) return 'S';
  if (density >= 70) return 'A';
  if (density >= 55) return 'B';
  return 'C';
}

function statsFromDensity(density: number) {
  // 밀도 65 → HP ~130, ATK ~26
  // 밀도 85 → HP ~170, ATK ~34
  const hp = Math.round(80 + density * 1.05);
  const atk = Math.round(8 + density * 0.32);
  return { hp, atk };
}

let cachedGhosts: Ghost[] | null = null;

export function generateGhosts(count = 5): Ghost[] {
  const used = new Set<string>();
  const ghosts: Ghost[] = [];
  for (let i = 0; i < count; i++) {
    const d = pickWeightedDistrict();
    // 실제 위치는 창원폴리텍대학 인근, 등급/스탯은 d.crimeDensity 기준
    const [lat, lng] = spawnNearPolytech();

    let name: string;
    do {
      name = GHOST_NAME_POOL[Math.floor(Math.random() * GHOST_NAME_POOL.length)];
    } while (used.has(name) && used.size < GHOST_NAME_POOL.length);
    used.add(name);

    const grade = gradeFromDensity(d.crimeDensity);
    const stats = statsFromDensity(d.crimeDensity);

    ghosts.push({
      id: `ghost-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      lat,
      lng,
      district: d.name,
      crimeType: d.dominantCrime,
      density: d.crimeDensity,
      grade,
      hp: stats.hp,
      atk: stats.atk,
      spawnedAt: new Date().toISOString(),
    });
  }
  return ghosts;
}

export function getGhosts(): Ghost[] {
  if (!cachedGhosts) cachedGhosts = generateGhosts(5);
  return cachedGhosts;
}

export function respawnGhosts(): Ghost[] {
  cachedGhosts = generateGhosts(5);
  return cachedGhosts;
}
