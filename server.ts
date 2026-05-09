import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Environment Analysis Logic
  app.post("/api/analyze", (req, res) => {
    const { 
      brightness,      // 0-100 (Low is dark)
      cctvCount,       // Number of CCTVs
      populationDensity, // Floating 0.0 - 1.0
      isAbandoned,     // Boolean
      crimeStatsWeight // 0.0 - 1.0
    } = req.body;

    // Safety Checks
    const b = brightness ?? 50;
    const c = cctvCount ?? 2;
    const p = populationDensity ?? 0.5;
    const a = isAbandoned ? 1 : 0;
    const cs = crimeStatsWeight ?? 0.5;

    /**
     * RISK CALCULATION FORMULA
     * (Low Brightness * 0.2) + (Abandoned * 0.25) + (Crime Stats * 0.3) + (Low CCTV * 0.15) + (Low Pop * 0.1)
     */
    const brightnessRisk = ((100 - b) / 100) * 0.2;
    const abandonedRisk = a * 0.25;
    const crimeRisk = cs * 0.3;
    const cctvRisk = Math.max(0, (5 - c) / 5) * 0.15;
    const popRisk = (1 - p) * 0.1;

    const totalScore = (brightnessRisk + abandonedRisk + crimeRisk + cctvRisk + popRisk) * 100;
    const finalScore = Math.min(100, Math.round(totalScore));

    // Grade Assignment
    let grade = 'C';
    if (finalScore >= 90) grade = 'S';
    else if (finalScore >= 75) grade = 'A';
    else if (finalScore >= 60) grade = 'B';

    res.json({
      score: finalScore,
      grade,
      timestamp: new Date().toISOString(),
      metadata: {
        dominantFactor: brightnessRisk > abandonedRisk ? 'Low Lighting' : 'Unsafe Structural Integrity'
      }
    });
  });

  // API Route: Get Hotspots (Mock)
  app.get("/api/hotspots", (req, res) => {
    res.json([
      { id: 1, lat: 37.5665, lng: 126.9780, risk: 92, type: 'THEFT_HIGH' },
      { id: 2, lat: 37.5172, lng: 127.0473, risk: 84, type: 'BLIND_SPOT' },
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
