# Safe Route Navigator

> **Dynamic, Personalized & Explainable Safety-Aware Navigation**  
> *A production-ready full-stack web application for walking, cycling, driving, and accessibility-focused route planning with transparent mathematical risk scoring, recency decay, uncertainty confidence estimation, and dynamic crowd reporting.*

---

## 🌟 Table of Contents
1. [Project Overview](#-project-overview)
2. [Critical Safety & Uncertainty Principles](#-critical-safety--uncertainty-principles)
3. [Key Features](#-key-features)
4. [Architecture & System Design](#-architecture--system-design)
5. [Technology Stack](#-technology-stack)
6. [Mathematical Risk & Confidence Algorithms](#-mathematical-risk--confidence-algorithms)
7. [Database Schema](#-database-schema)
8. [Quick Start & Setup Guide](#-quick-start--setup-guide)
   - [Running with Docker Compose](#option-a-docker-compose-recommended)
   - [Running Locally without Docker](#option-b-native-local-development)
9. [Interactive Hackathon Demo Scenarios](#-interactive-hackathon-demo-scenarios)
10. [API Documentation](#-api-documentation)
11. [Testing Suite](#-testing-suite)
12. [Future Machine Learning Extensibility](#-future-machine-learning-extensibility)

---

## 🚀 Project Overview

Standard navigation applications (e.g. Google Maps, Waze, Apple Maps) optimize strictly for **minimum travel time** or **shortest distance**. However, for vulnerable pedestrians, late-night commuters, women, the elderly, and wheelchair users, the fastest path is often an unlit, secluded, or high-incident alleyway.

**Safe Route Navigator** redefines urban route optimization by:
1. Evaluating multi-alternative corridors (**Fastest**, **Balanced ⭐ Recommended**, and **Safest**).
2. Segment-by-segment multi-factor safety evaluation with **mathematical explainability**.
3. Applying **exponential recency decay** $e^{-\lambda \cdot \Delta t}$ to crowd reports so fresh hazards have immediate impact while historic reports decay gracefully.
4. Implementing a dedicated **Uncertainty / Confidence Engine** that guarantees:
   $$\text{No Data} \neq \text{Safe} \quad \implies \quad \text{No Data} = \text{Unknown (Low Confidence)}$$
5. Instant **dynamic re-evaluation** when time changes (diurnal daylight vs midnight risk curves) or when community members log live hazard reports.

---

## 🛡️ Critical Safety & Uncertainty Principles

> [!IMPORTANT]
> - **Estimated Risk Score, NOT Crime Prediction**: The system produces an explainable, relative risk score ($0 \dots 100$) based on municipal infrastructure and verified observations. It does *not* claim to predict individual criminal acts.
> - **Explicit Confidence Metric**: Every route and road segment returns both an **Estimated Risk Score** and a **Data Certainty Confidence Score** ($0\% \dots 100\%$).
> - **Unknown Area Protection**: If a road has insufficient safety data, the system flags it as `UNKNOWN / LIMITED DATA` with reduced confidence rather than displaying `SAFE`.

---

## ⚡ Key Features

- **Multi-Criteria Route Optimization**:
  - **Fastest**: Minimal travel duration.
  - **Safest**: Minimal aggregate risk score, maximizing illumination and emergency proximity.
  - **Balanced ⭐ (Recommended)**: Pareto-optimal combination:
    $$\text{Score} = 0.50 \cdot \text{Normalized Time} + 0.50 \cdot \text{Normalized Risk}$$
- **Personalized Safety Profiles**:
  - `WOMAN`: Elevated sensitivity to street lighting, crowd isolation, harassment reports, and night-time decay.
  - `GENERAL`: Balanced urban commuter profile.
  - `CHILD_GUARDIAN`: Emphasizes pedestrian sidewalks, crosswalks, and speed-controlled streets.
  - `ELDERLY`: Emphasizes illumination, smooth footing, and proximity to medical facilities.
  - `ACCESSIBILITY`: Heavily weights wheelchair ramps, smooth pavement, and avoids broken walkways or steps.
- **Dynamic Simulated Time Control**: Continuous 24-hour slider and quick presets (Morning 9 AM, Peak 2 PM, Dusk 6:30 PM, Night 11:30 PM).
- **Crowd-Sourced Hazard Reporting**:
  - Instant submission for *Poor Lighting*, *Harassment*, *Suspicious Activity*, *Accident*, *Road Blocked*, *Unsafe Crowd*, and *Isolated Area*.
  - **Duplicate Clustering**: Nearby reports within 150m and 4 hours reinforce existing alerts rather than creating multi-counted risk spikes.
  - **Live Recalculation**: Submitting a hazard immediately updates affected route risk scores in real-time.
- **Emergency SOS & Safe Havens**:
  - 1-tap emergency dialers (112, 100, 108, Women's Helpline 1091).
  - Nearest physical refuge stations (Police Precincts, 24/7 Trauma Centers, All-Night Pharmacies) with distance and contact info.
- **Municipal Admin Dashboard (`/admin`)**:
  - Real-time KPIs (Total reports, Active high-risk alerts, Reports today, Analyzed routes, Average system confidence).
  - Community observation verification queue (Verify, Reject, Change Severity).
  - High-risk corridor watchlist.
- **Interactive Judge Demo Console**: 1-click execution of dynamic scenarios for hackathon presentations.

---

## 🏗️ Architecture & System Design

```
safe-route-navigator/
│
├── frontend/                     # React 18 + TypeScript + Vite + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── components/           # MapComponent, RouteCard, NavigationControlPanel, RiskExplainerModal, etc.
│   │   ├── services/             # Typed Axios API Client
│   │   ├── types/                # Route, Segment, Incident, Report, SafePlace interfaces
│   │   ├── utils/                # Centralized Risk & Confidence Theme Configurations
│   │   ├── App.tsx               # Master App Component
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                      # Python 3.12 + FastAPI + SQLAlchemy + Pydantic v2
│   ├── app/
│   │   ├── api/                  # routes.py, reports.py, risk.py, places.py, admin.py, auth.py
│   │   ├── database/             # connection.py, models.py, seed.py
│   │   ├── risk_engine/          # calculator.py, factors.py, weights.py, confidence.py, decay.py, explainer.py
│   │   ├── routing/              # graph.py, router.py (Multi-alternative pathfinder)
│   │   ├── schemas/              # Pydantic request & response models
│   │   ├── services/             # safety_service.py, report_service.py, admin_service.py, auth_service.py
│   │   ├── config.py             # App Settings
│   │   └── main.py               # FastAPI entry point
│   ├── tests/                    # test_risk_engine.py, test_api.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/                         # Synthetic seed dataset
│   ├── seed/
│   │   ├── road_segments.json    # 95 realistic road segments with infrastructure telemetry
│   │   ├── incidents.json        # 219 historical crime/accident records
│   │   ├── crowd_reports.json    # 189 community hazard submissions
│   │   └── safe_places.json      # 62 emergency points (Police, Hospitals, 24/7 Havens)
│   ├── sample_incidents.csv
│   └── sample_roads.geojson
│
├── docker-compose.yml            # Multi-container orchestration (Frontend + Backend + PostGIS)
├── .env.example
├── README.md
└── LICENSE
```

---

## 📐 Mathematical Risk & Confidence Algorithms

### 1. Risk Factor Normalization
All 9 core safety dimensions are normalized to $[0.0 \dots 1.0]$ where **0.0 = Safe** and **1.0 = High Hazard**:

| Factor | Description | Normalization Method |
| :--- | :--- | :--- |
| `crime_history` | Historical incident density & severity | $1.0 - e^{-0.15 \cdot (\text{count} + 1.5 \cdot \text{high\_sev})}$ |
| `recent_reports` | Decayed, clustered community hazard logs | $1.0 - e^{-0.65 \cdot \sum (\text{sev} \cdot \text{rel} \cdot e^{-\lambda \Delta t})}$ |
| `time_of_day` | Diurnal solar/activity curve | $0.50 + 0.45 \cdot \cos\left(\frac{2\pi (\text{hour} - 2)}{24}\right)$ |
| `street_lighting` | Photometric illumination & darkness | $(1.0 - \text{lighting})$, mitigated by daytime solar angle |
| `crowd_isolation` | Seclusion index vs active foot traffic | $\text{isolation} \times (1.0 - 0.7 \cdot \text{traffic})$, amplified at midnight |
| `infrastructure` | Sidewalks, crosswalks, ramps, surface | $1.0 - (0.7 \cdot \text{ped\_infra} + 0.3 \cdot \text{access\_score})$ |
| `emergency_access` | Proximity to nearest police/hospital | $\min(d_{\text{police}}, d_{\text{hospital}}) / 3000.0\text{ m}$ |
| `accident_history` | Vehicle/pedestrian collision frequency | $(0.15 \cdot \text{accidents}) + (0.35 \cdot \text{traffic})$ |
| `weather` | Precipitation & slick surface modifier | Clear ($0.05$), Rain ($0.45$), Storm ($0.90$), Fog ($0.60$) |

### 2. Exponential Recency Decay
Recent crowd observations carry high statistical significance and decay continuously over time:
$$\text{Impact}(t) = \text{Initial Severity} \times \text{User Reliability} \times e^{-\lambda \cdot \Delta t_{\text{days}}}$$
*With default $\lambda = 0.08$: 1 hour ago ($99.6\%$), 3 days ago ($79\%$), 7 days ago ($57\%$), 30 days ago ($9\%$).*

### 3. Non-Linear Route Risk Aggregation
A dangerous alleyway cannot be concealed behind long safe avenues. The route aggregation applies distance-weighted mean plus a non-linear penalty for extreme segment spikes:
$$\text{Route Risk} = \bar{R}_{\text{weighted}} + \gamma \cdot \max(0, R_{\max} - \bar{R}_{\text{weighted}}) \quad (\gamma = 0.25)$$

### 4. Data Certainty (Confidence Metric)
$$\text{Confidence} = \text{Base}(45\%) + \Delta_{\text{hist\_volume}} + \Delta_{\text{recent\_freshness}} - \text{Penalties}_{\text{missing\_factors}} - \text{Penalties}_{\text{spatial\_sparsity}}$$
- If confidence $< 50\%$, the route displays **"Limited Safety Data Available"** and grey status badges.

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS 3, Leaflet, React-Leaflet, Lucide React, Axios |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Shapely, NumPy, Pandas, Scikit-learn, Uvicorn |
| **Database** | PostgreSQL 15 + PostGIS 3.3 (Docker) / SQLite with GeoJSON spatial math (Zero-config local) |
| **Security** | Direct bcrypt hashing, JWT (HS256), OAuth2 Bearer, Role-Based Access Control |
| **DevOps** | Docker, Docker Compose, Nginx Alpine, Multi-stage builds |

---

## ⚡ Quick Start & Setup Guide

### Option A: Docker Compose (Recommended)

To build and run all services (Frontend, Backend, PostGIS) in one command:

```bash
# 1. Clone repository
git clone <repository_url>
cd safe-route-navigator

# 2. Start all services with Docker Compose
docker compose up --build
```

**Access Services:**
- 🌐 **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📚 **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Native Local Development (Zero-Config)

If Docker is not installed on your system, you can run the application directly using standard Python and Node commands. The backend automatically initializes local SQLite with the synthetic dataset:

#### 1. Start the Backend API
```bash
# Navigate to workspace root
cd safe-route-navigator

# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI dev server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir backend
```

#### 2. Start the Frontend React App
```bash
# In a second terminal, navigate to frontend
cd safe-route-navigator/frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🎯 Interactive Hackathon Demo Scenarios

Safe Route Navigator includes a dedicated **Judge Demo Console Bar** at the top of the interface:

### Scenario 1: Day to 11:30 PM Night Shift
1. Select preset: **"College Campus → Central Railway Station"**.
2. Click **"1. Night Shift (11:30 PM)"**.
3. **Observed Result**: Risk scores immediately increase across all routes (Route A: $65 \to 78$, Route B: $29 \to 43$, Route C: $15 \to 22$) due to reduced ambient lighting and midnight seclusion penalties.

### Scenario 2: Dynamic Hazard Injection (Recommendation Shift)
1. At 11:30 PM, Route B is currently marked as **RECOMMENDED** ($43/100$).
2. Click **"2. Live Incident on Route B"** (or open the **Report Hazard** modal and submit a *High Severity Poor Lighting* report).
3. **Observed Result**: Route B's risk surges from $43 \to 57/100$. The system dynamically re-evaluates the optimal path and crowns **Route C as the new RECOMMENDED Route**!

### Scenario 3: Wheelchair Accessibility Mode
1. Click **"3. Accessibility Mode"**.
2. **Observed Result**: The router switches profile and mode to Accessibility, strictly avoiding high-risk stairs and broken walkways, favoring smooth curb cuts, ramps, and brightly lit transit corridors.

---

## 📡 API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/routes/calculate` | Computes Fastest, Balanced, and Safest routes with factor breakdowns |
| `GET` | `/api/routes/presets` | Returns pre-configured hackathon demo scenarios |
| `GET` | `/api/risk/safety-map` | Retrieves full city-wide risk topology and segment color telemetry |
| `GET` | `/api/places/safe` | Retrieves emergency safe havens (Police, Hospitals, 24/7 Pharmacies) |
| `POST` | `/api/reports` | Submits crowd-sourced hazard report with duplicate clustering |
| `GET` | `/api/reports/nearby` | Queries active hazard reports within a given radius |
| `GET` | `/api/admin/dashboard` | Returns administrative KPIs, report verification queues, and high-risk segments |
| `POST` | `/api/admin/reports/{id}/verify` | Admin endpoint to verify and boost community report reliability |
| `POST` | `/api/admin/reports/{id}/reject` | Admin endpoint to reject and remove report from risk calculation |
| `POST` | `/api/auth/login` | Commuter & Admin JWT authentication |
| `POST` | `/api/auth/register` | Commuter account registration |

---

## 🧪 Testing Suite

Run the comprehensive automated test suite (13 unit and API integration tests):

```bash
# Run pytest with verbose output
python -m pytest backend/tests -v
```

**Verified Test Cases:**
- `test_risk_score_range()`: Verifies risk scores stay strictly bounded in $[0.0, 100.0]$.
- `test_missing_data_reduces_confidence()`: Verifies the uncertainty principle (missing data lowers confidence, never marked safe).
- `test_recent_report_has_higher_weight_and_decays()`: Verifies mathematical exponential decay $e^{-\lambda t}$.
- `test_time_of_day_diurnal_curve()`: Verifies late-night risk peaks vs daylight safety.
- `test_high_risk_segment_affects_route_aggregation()`: Verifies non-linear worst-segment penalty.
- `test_profile_weight_customization()`: Verifies Woman/Elderly/Accessibility profile weight modulations.
- `test_submit_crowd_report_and_clustering()`: Verifies spatial duplicate clustering.
- `test_calculate_routes()`, `test_safety_map_endpoint()`, `test_admin_dashboard_endpoint()`: Verifies end-to-end API responses.

---

## 🔮 Future Machine Learning Extensibility

The application architecture separates the **Risk Engine** (`backend/app/risk_engine/`) into modular components (`factors.py`, `weights.py`, `calculator.py`). In future iterations with large-scale labeled historical crime and sensor data, the weighted scoring model can be seamlessly swapped with supervised ML models:
- **Random Forest Regressor / Classifier** for non-linear interaction modeling.
- **XGBoost / LightGBM** for fast gradient-boosted spatial risk prediction.
- **Spatial Graph Neural Networks (GNNs)** for topological edge embedding across metropolitan road networks.

