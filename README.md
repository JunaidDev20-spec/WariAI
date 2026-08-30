# 🚨 WARI.AI

### 🧠 AI-Powered Crowd Intelligence & Operational Decision Platform

> **SEE NOW 👁️ → UNDERSTAND SPACE 🗺️ → PREDICT NEXT 🔮 → ACT BEFORE OVERFLOW ⚡**

WARI.AI is an AI-powered operational intelligence platform designed to help authorities monitor crowd conditions, understand spatial capacity, predict crowd growth, and coordinate resources during large-scale events such as the **Pandharpur Wari**.

Instead of only showing what is happening, WARI.AI helps operators understand:

- 👁️ **What is happening right now**
- 🗺️ **Where people can safely gather**
- 🔮 **What is likely to happen next**
- 🚨 **Which situations require immediate attention**
- 🚑 **Which resources should be deployed**

---

## ✨ Key Features

### 🖥️ Command Centre

A live operational dashboard for monitoring Mukams and crowd conditions.

- 🗺️ Interactive spatial map
- 👥 Crowd density and zone monitoring
- 📊 Live crowd load
- ⚠️ Risk status visualization
- 🔮 Forecast overlays
- 📍 Mukam switching
- 🚨 Priority operational actions

---

### 🚨 Incident Management

Track and manage operational incidents from detection to resolution.

```text
🔍 DETECTED
     ↓
⚠️ ESCALATED
     ↓
🚑 RESPONSE DEPLOYED
     ↓
🚗 EN ROUTE
     ↓
🛠️ ACTIVE
     ↓
✅ RESOLVED
```

Features include:

- 🔴 Incident severity tracking
- 📋 Incident queue
- 🕒 Operational timeline
- 🚑 Resource assignment
- 📍 Zone and Mukam information
- ⚡ Response status

---

### 🧠 AI Intelligence

WARI.AI is built around three intelligence layers.

```text
👁️ M1 — CROWD VISION
        ↓
🗺️ M2 — SPATIAL AI
        ↓
🔮 M3 — POPULATION FORECASTING
        ↓
⚡ OPERATIONAL INSIGHT
```

#### 👁️ M1 — Crowd Vision

Understands the **current crowd situation**.

**Planned AI pipeline:**

- YOLO for person detection
- ByteTrack for crowd tracking

**Outputs:**

- 👥 Current people count
- 📊 Crowd density
- 🚶 Crowd movement
- 📍 Zone-level observations

---

#### 🗺️ M2 — Spatial Intelligence

Understands the **physical capacity of a Mukam**.

Uses:

- 🛰️ Satellite imagery
- 🗺️ OpenStreetMap
- 📍 GIS data

Analyzes:

- Roads
- Open grounds
- Buildings
- Gathering zones
- Parking areas
- Other mapped infrastructure

**Output:**

> Where can people physically occupy and concentrate?

---

#### 🔮 M3 — Population Forecasting

Predicts crowd conditions in the near future.

**Inputs:**

- Current crowd observations
- Historical Wari patterns
- Weather
- Time
- Location
- Event phase
- Zone-level information

**Model:**

- 🌲 XGBoost

**Forecast horizons:**

```text
NOW
 ↓
+30 MIN
 ↓
+60 MIN
```

---

## 🧩 How WARI.AI Works

```text
                👁️ CROWD VISION
                       │
                       ▼
                CURRENT CROWD STATE
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼

   🗺️ SPATIAL AI              🔮 FORECASTING

   Understand space           Predict growth
          │                         │
          └────────────┬────────────┘
                       ▼
                 ⚠️ RISK ENGINE
                       │
                       ▼
                 🚨 INCIDENTS
                       │
                       ▼
                🚑 DEPLOYMENT
                       │
                       ▼
               ⚡ OPERATIONAL ACTION
```

---

# 🖥️ Application Modules

| Module | Description |
|---|---|
| 🎛️ **Command Centre** | Live crowd and operational monitoring |
| 🚨 **Incidents** | Alert lifecycle and response management |
| 🧠 **Intelligence** | M1, M2 and M3 analysis and forecasting |
| 🚑 **Resources** | Operational resource and deployment tracking |
| 🌍 **Event Overview** | System-wide Wari operational status |

---

# 🛠️ Tech Stack

### 🎨 Frontend

- ⚛️ React
- 🔷 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS

### 🧠 AI Architecture

- 👁️ YOLO — Person Detection
- 🚶 ByteTrack — Object Tracking
- 🔮 XGBoost — Population Forecasting
- 🗺️ GIS / OpenStreetMap — Spatial Intelligence

> **Note:** The current version primarily demonstrates the frontend architecture and operational workflow. Some AI signals and live values use deterministic simulation/demo data until the complete AI pipelines are integrated.

---

# 📁 Project Structure

```text
src/
│
├── components/        # Reusable UI components
├── command/           # Command Centre and map
├── incidents/         # Incident management
├── intelligence/      # AI pipeline and forecasting UI
├── resources/         # Resource monitoring
├── engine/            # Simulation and operational logic
├── hooks/             # Custom React hooks
├── data/              # Mukam and demo data
├── types/             # TypeScript types
│
├── App.tsx
└── main.tsx
```

---

# 🚀 Installation & Setup

Follow these steps to run WARI.AI locally.

## 1️⃣ Prerequisites

Make sure you have **Node.js** installed.

Check your installation:

```bash
node -v
npm -v
```

Recommended:

```text
Node.js 18+
npm 9+
```

---

## 2️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
```

Move into the project folder:

```bash
cd YOUR_REPOSITORY_NAME
```

---

## 3️⃣ Install Dependencies

Run:

```bash
npm install
```

This will install all required project dependencies.

---

## 4️⃣ Start the Development Server

```bash
npm run dev
```

After starting the server, open the URL shown in your terminal.

Usually:

```text
http://localhost:5173
```

🎉 The application should now be running locally.

---

# 📦 Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

# 🎮 Demo Flow

The intended operational flow of the platform is:

```text
🌍 EVENT OVERVIEW
        ↓
🎛️ COMMAND CENTRE
        ↓
👥 Crowd conditions monitored
        ↓
👁️ M1 detects increasing density
        +
🗺️ M2 identifies spatial limitations
        +
🔮 M3 predicts future growth
        ↓
⚠️ ZONE RISK INCREASES
        ↓
🚨 INCIDENT CREATED
        ↓
🚑 RESPONSE DEPLOYED
        ↓
🚗 RESOURCE EN ROUTE
        ↓
🛠️ OPERATION ACTIVE
        ↓
✅ INCIDENT RESOLVED
```

---

# 🎨 Design Philosophy

WARI.AI uses a restrained operational design system.

### 🌈 Color Meaning

| Color | Purpose |
|---|---|
| 🟢 **Teal** | Live / Current / Operational |
| 🟣 **Violet** | AI / Forecasting / Future |
| 🟡 **Gold** | Spatial Intelligence / Attention |
| 🔴 **Red** | Critical Risk |
| ⚫ **Neutral** | Primary Interface Surfaces |

### 🔤 Typography

- **Manrope** → Interface, headings and metrics
- **IBM Plex Mono** → IDs, timestamps and technical metadata

### ◻️ Interface Style

- Rounded geometry
- Floating navigation
- Large operational surfaces
- Minimal visual noise
- Purposeful semantic colors

---

# 🔮 Future Improvements

Planned improvements include:

- 🎥 Real-time CCTV/video processing
- 👁️ YOLO-based live crowd detection
- 🚶 ByteTrack movement analysis
- 🛰️ Satellite imagery segmentation
- 🗺️ OpenStreetMap + GIS integration
- 🌦️ Weather API integration
- 📈 Historical Wari dataset integration
- 🔮 Production XGBoost forecasting
- 🗄️ Backend API and database
- 🔐 Authentication and role-based access
- ⚡ WebSocket real-time updates
- 📍 Live resource tracking
- 📱 Mobile operator interface

---

# ⚠️ Current Project Status

The current version is a **functional hackathon prototype and operational frontend demonstration**.

Some displayed values currently use:

- Deterministic simulation
- Structured demo data
- Mock operational signals

The interface is designed so that real AI models and data pipelines can be integrated without redesigning the complete product.

---

# 👥 Team

Built for **Varithon 2026** 🚀

---

## 💡 Core Vision

```text
👁️ SEE NOW

        +

🗺️ UNDERSTAND SPACE

        +

🔮 PREDICT NEXT

        =

⚡ ACT BEFORE OVERFLOW
```

---

<p align="center">

**Built to transform crowd intelligence into operational action. 🚀**

</p>
