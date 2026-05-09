import { GoogleGenAI, Type } from '@google/genai';

export interface VisionScores {
  brightness: number;        // 0-100, 높을수록 어두움
  abandoned: number;         // 0-100, 높을수록 폐건물 같음
  graffiti: number;          // 0-100, 낙서/훼손 정도
  lowPopulation: number;     // 0-100, 유동인구 부족 정도
  eerieEnvironment: number;  // 0-100, 음산함/분위기
  structuralHazard: number;  // 0-100, 구조적 위험 요소
  rationale: string;         // 한 줄 설명
}

export interface RiskResult {
  scores: VisionScores;
  horrorScore: number;       // 0-100
  horrorGrade: 'S' | 'A' | 'B' | 'C';
  dangerScore: number;       // 0-100
  source: 'ai' | 'fallback';
}

const PROMPT = `너는 도시 안전 분석 보조 AI다. 주어진 사진을 분석해서 아래 6개 항목을 각 0-100 점수로 평가하라.

평가 기준:
- brightness: 장면이 얼마나 어두운가 (밝으면 0, 칠흑같이 어두우면 100)
- abandoned: 폐건물·방치된 구조물·관리 안 되는 환경 정도 (깨끗하면 0, 폐허면 100)
- graffiti: 낙서·훼손·쓰레기 등 무질서 흔적 (없으면 0, 심하면 100)
- lowPopulation: 유동인구 부족, 인적 드문 정도 (사람 많으면 0, 아무도 없으면 100)
- eerieEnvironment: 음산하고 으스스한 분위기 (밝고 활기차면 0, 공포영화 같으면 100)
- structuralHazard: 구조적 위험 요소(붕괴 위험, 위태로운 시설물 등) (안전하면 0, 위험하면 100)

또한 "rationale" 필드에 한국어로 한두 문장 근거를 적어라.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    brightness: { type: Type.INTEGER },
    abandoned: { type: Type.INTEGER },
    graffiti: { type: Type.INTEGER },
    lowPopulation: { type: Type.INTEGER },
    eerieEnvironment: { type: Type.INTEGER },
    structuralHazard: { type: Type.INTEGER },
    rationale: { type: Type.STRING },
  },
  required: [
    'brightness', 'abandoned', 'graffiti',
    'lowPopulation', 'eerieEnvironment', 'structuralHazard', 'rationale'
  ],
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function computeScores(s: VisionScores) {
  // 위험도 (사용자 명세 가중치): 조도0.20 + 폐건물0.25 + 유동인구0.15 + 낙서0.10 + 범죄통계0.30
  // 범죄통계는 이미지로 못 보므로 eerieEnvironment+structuralHazard 평균을 프록시로 사용
  const crimeProxy = (s.eerieEnvironment + s.structuralHazard) / 2;
  const dangerScore = clamp(
    s.brightness * 0.20 +
    s.abandoned * 0.25 +
    s.lowPopulation * 0.15 +
    s.graffiti * 0.10 +
    crimeProxy * 0.30
  );

  // 공포도: 조도, 폐건물, 이미지 분위기, 음산한 환경 기반
  const horrorScore = clamp(
    s.brightness * 0.30 +
    s.abandoned * 0.25 +
    s.eerieEnvironment * 0.25 +
    s.structuralHazard * 0.20
  );

  let horrorGrade: 'S' | 'A' | 'B' | 'C' = 'C';
  if (horrorScore >= 80) horrorGrade = 'S';
  else if (horrorScore >= 60) horrorGrade = 'A';
  else if (horrorScore >= 40) horrorGrade = 'B';

  return { horrorScore, horrorGrade, dangerScore };
}

function fallbackScores(): VisionScores {
  const r = () => Math.floor(Math.random() * 60) + 20;
  return {
    brightness: r(), abandoned: r(), graffiti: r(),
    lowPopulation: r(), eerieEnvironment: r(), structuralHazard: r(),
    rationale: 'AI 분석 미사용 — 더미 점수입니다.',
  };
}

export async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<RiskResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const scores = fallbackScores();
    return { scores, ...computeScores(scores), source: 'fallback' };
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(text);
    const scores: VisionScores = {
      brightness: clamp(parsed.brightness),
      abandoned: clamp(parsed.abandoned),
      graffiti: clamp(parsed.graffiti),
      lowPopulation: clamp(parsed.lowPopulation),
      eerieEnvironment: clamp(parsed.eerieEnvironment),
      structuralHazard: clamp(parsed.structuralHazard),
      rationale: String(parsed.rationale ?? ''),
    };
    return { scores, ...computeScores(scores), source: 'ai' };
  } catch (err) {
    console.warn('[ai] Gemini 분석 실패, 폴백 사용:', (err as Error).message);
    const scores = fallbackScores();
    return { scores, ...computeScores(scores), source: 'fallback' };
  }
}
