# Ghost Hunters Data Structures (PostgreSQL/PostGIS)

## 1. Profiles Table (Users)
```sql
CREATE TABLE hunters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    ghost_coins BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Scandata Table (AI Analysis Results)
- `location` uses PostGIS `GEOGRAPHY(POINT, 4326)` for spatial queries.
```sql
CREATE TABLE scans (
    id BIGSERIAL PRIMARY KEY,
    hunter_id UUID REFERENCES hunters(id),
    location GEOGRAPHY(POINT, 4326),
    image_url TEXT,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    grade CHAR(1), -- S, A, B, C
    analysis_json JSONB, -- { dominantFactor, brightness, threats: [] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for distance-based queries (Police Dashboard Heatmap)
CREATE INDEX scans_location_gix ON scans USING GIST (location);
```

## 3. Entities Table (Monster Spawns)
```sql
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    base_threat_level INTEGER,
    active BOOLEAN DEFAULT true
);
```

## 4. Rankings Materialized View
```sql
CREATE MATERIALIZED VIEW hunter_leaderboard AS
SELECT 
    hunters.id,
    hunters.username,
    hunters.level,
    SUM(scans.risk_score) as total_risk_points,
    RANK() OVER (ORDER BY SUM(scans.risk_score) DESC) as rank
FROM hunters
JOIN scans ON hunters.id = scans.hunter_id
GROUP BY hunters.id;
```
