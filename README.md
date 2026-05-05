<div align="center">

<br/>

```
████████████████████████████████████████████████████████████
██                                                        ██
██      ██████╗ ██╗██████╗ ██████╗ ██████╗ ███╗  ██╗    ██
██     ██╔══██╗██║██╔══██╗██╔════╝██╔═══██╗████╗ ██║    ██
██     ███████║██║██║  ██║██║     ██║   ██║██╔██╗██║    ██
██     ██╔══██║██║██║  ██║██║     ██║   ██║██║╚████║    ██
██     ██║  ██║██║██████╔╝╚██████╗╚██████╔╝██║ ╚███║    ██
██     ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚══╝    ██
██                                                        ██
████████████████████████████████████████████████████████████
```

# **AidConnect®**
### *Through chaos, we coordinate compassion.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Genkit](https://img.shields.io/badge/Genkit-FF6D00?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com)

<br/>

> **Built for the Google Solution Challenge 2025**  
> *Bridging the last-mile gap between NGOs, volunteers, and communities in crisis.*

<br/>

---

</div>

## 🌊 The Story

> *It was 3 AM. Floodwaters were rising in a coastal village. Three NGOs had volunteers ready — but none of them knew each other existed. A doctor skilled in triage was 2 km away from a child who needed her. Aid trucks were circling, not knowing where to go. People had submitted paper forms begging for help — forms that were soaking in the same floodwater they described.*

**This is the story AidConnect was born to rewrite.**

Every year, millions of dollars in aid are misallocated. Thousands of skilled volunteers go unmatched. Truckloads of resources never reach the right people — not because they don't exist, but because **the coordination layer is broken**.

AidConnect is not just an app. It is **the connective tissue of disaster response** — an intelligent, real-time operations platform that bridges NGOs, field workers, and volunteers into a single, AI-orchestrated network.

---

## ⚡ What AidConnect Does

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   NGO posts a need     →    AI prioritizes it    →    Volunteer matched │
│                                                                         │
│   Field worker submits →    OCR digitizes it     →    Ops team notified │
│   paper report                                                          │
│                                                                         │
│   Disaster strikes     →    Emergency Mode ON    →    All normal rules  │
│                                                        suspended, life- │
│                                                        critical FIRST   │
└─────────────────────────────────────────────────────────────────────────┘
```

In plain English? **AidConnect makes sure help actually gets to the people who need it.**

---

## 🧠 The Brain — AI at the Core

AidConnect isn't just a database with a pretty face. It has **five distinct AI-powered flows**, each one a specialist in its own right:

### 🎯 `prioritize-needs-flow`
Takes raw field data — messy, unstructured, multi-lingual — and assigns **priority scores** (High / Medium / Low) based on severity, affected population, and urgency signals. The AI reads between the lines so humans don't have to.

### 🤝 `ngo-ai-match-volunteers`
When an NGO needs people on the ground, this flow scans the volunteer pool and performs a **multi-dimensional match**: skills, languages, location proximity, availability, and domain expertise. It doesn't just find a person — it finds *the right* person.

### 💡 `ngo-ai-explain-insights`
Explainability built-in. Every AI decision comes with a **plain-language explanation**. Why was this need marked critical? Why was *this* volunteer chosen over others? AidConnect never leaves field commanders guessing.

### 🧭 `suggest-ngo-flow`
When a new volunteer joins, the platform doesn't just leave them floating. A sophisticated scoring algorithm (with optional Gemini AI boost) evaluates geographic coverage, focus area alignment, language match, and operational scale to **recommend the ideal NGO** for every volunteer.

### 🤖 `volunteer-assistant-flow`
A 24/7 AI assistant embedded into the volunteer experience. Ask it anything — available tasks, how to submit a report, what to do in an emergency. The assistant knows the platform inside out.

---

## 🏗️ Architecture — Built to Scale Under Pressure

```
┌──────────────────────────────────────────────────────────────────┐
│                        AidConnect Platform                       │
├──────────────┬───────────────────────┬───────────────────────────┤
│   Next.js 15 │    Firebase Firestore  │    Google Genkit + Gemini │
│   App Router │    Real-time Listeners │    AI Flow Engine         │
│   Turbopack  │    Role-based Security │    Explainable AI         │
├──────────────┼───────────────────────┼───────────────────────────┤
│  React 19    │   Firebase Auth        │    Tesseract.js OCR       │
│  TypeScript  │   Firebase Storage     │    Leaflet Maps           │
│  Tailwind    │   App Hosting          │    Recharts Analytics     │
│  shadcn/ui   │   Cloud Run            │    react-google-maps      │
└──────────────┴───────────────────────┴───────────────────────────┘
```

Every piece was chosen deliberately:
- **Next.js 15 + Turbopack** → The fastest possible iteration under pressure
- **Firebase Firestore** → Real-time data sync, because in a crisis, stale data costs lives
- **Google Genkit** → Production-grade AI flow orchestration, not a toy wrapper
- **Tesseract.js** → OCR directly in the browser; no server round-trip, no latency
- **react-leaflet + Google Maps** → Dual-layer geospatial visibility

---

## 🎭 Three Worlds, One Platform

AidConnect serves three very different types of users — each with their own dedicated experience:

### 🛡️ Admin — *The Command Centre*
The nerve center. Admins see everything: all NGOs, all volunteers, all tasks, all pending approvals. They can assign unassigned volunteers to NGOs, track platform-wide stats, and — most critically — **activate Emergency Mode**.

```
📊 Platform Stats     🏢 NGO Registry      ⚠️ Action Required
━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━
Total NGOs: 12        Rescue India         Unassigned: 3
Volunteers: 89        Focus: Flood, Med    volunteers pending
Tasks Done: 247       Volunteers: 14       NGO assignment
Pending: 3            City: Hyderabad
```

### 🏢 NGO — *The Operations Hub*
NGOs get a rich, real-time dashboard to:
- Post community needs with location and urgency tags
- View AI-matched volunteer recommendations with explanations
- Dispatch volunteers to tasks via a visual Kanban-style board
- Monitor field reports coming in from the ground
- Track impact metrics and task completion rates
- Run analytics on their operations

### 🙋 Volunteer — *The Ground Truth*
Volunteers get a clean, mobile-optimized experience:
- Browse available tasks filtered by their skills and location
- Accept missions with one tap
- Submit field reports (text or scanned paper → OCR)
- Chat with an AI assistant for guidance
- Mark task completion with proof-of-work feedback
- Track personal impact history

---

## 🚨 Emergency Mode — The Feature That Changes Everything

```
╔═══════════════════════════════════════════════════════╗
║  ⚡ EMERGENCY MODE ACTIVATED                          ║
║                                                       ║
║  Disaster Type: 🌊 Flood                             ║
║  Affected Region: Gachibowli, North Sector           ║
║                                                       ║
║  ▶ All normal priority rules: SUSPENDED              ║
║  ▶ Life-critical tasks: AUTO-ELEVATED                ║
║  ▶ Emergency broadcast: SENT to all volunteers       ║
║  ▶ Resources: RE-ROUTED                              ║
╚═══════════════════════════════════════════════════════╝
```

When floods hit, when earthquakes strike, when wildfires spread — you don't have time for bureaucracy. Emergency Mode is a single-click override that:
- **Suspends** all non-critical task priorities
- **Auto-elevates** life-threatening needs to the top of every queue
- **Broadcasts** an immediate alert to every active volunteer in the affected region
- **Locks in** a disaster type (Flood / Earthquake / Fire / Medical Crisis / Food Emergency) and affected region
- **Notifies** all NGO coordinators simultaneously

*One button. Zero delays. Maximum response.*

---

## 🗺️ Feature Map

| Feature | Status | Details |
|---|---|---|
| 📋 Field Data Submission Portal | ✅ Live | Web forms for NGOs and field workers |
| 📄 Document Digitization (OCR) | ✅ Live | Tesseract.js — browser-side, zero latency |
| 🧠 AI Need Prioritization | ✅ Live | Gemini-powered, with confidence scores |
| 🤝 Intelligent Volunteer Matching | ✅ Live | Skills + location + language + domain |
| 📊 Real-time Operations Dashboard | ✅ Live | Live Firestore listeners + Recharts |
| 🔔 Automated Alert System | ✅ Live | In-app notifications + emergency broadcasts |
| 🔐 Role-based Access Control | ✅ Live | Admin / NGO / Volunteer — strict guards |
| 🌐 Multilingual UI | ✅ Live | Telugu, Tamil, Hindi, Malayalam, Kannada |
| 📍 Heatmap Visualization | ✅ Live | Geospatial need density mapping |
| 📈 Impact Analytics | ✅ Live | People helped, tasks done, response times |
| 💬 Explainable AI | ✅ Live | Every AI decision comes with a "why" |
| 🔄 Feedback Loop | ✅ Live | Task completion + NGO effectiveness rating |
| 🚨 Emergency Mode | ✅ Live | One-click override for disaster scenarios |
| 🤖 Volunteer AI Chatbot | ✅ Live | 24/7 contextual assistant |
| 🗺️ Interactive Map View | ✅ Live | Leaflet + Google Maps integration |

---

## 🧬 Codebase DNA

```
src/
├── ai/
│   ├── flows/
│   │   ├── prioritize-needs-flow.ts       # 🧠 AI Need Scorer
│   │   ├── ngo-ai-match-volunteers.ts     # 🤝 Smart Volunteer Matcher
│   │   ├── ngo-ai-explain-insights.ts     # 💡 Explainability Engine
│   │   ├── suggest-ngo-flow.ts            # 🧭 NGO Recommender
│   │   └── volunteer-assistant-flow.ts   # 🤖 AI Chatbot Backend
│   └── genkit.ts                          # ⚙️ Genkit configuration
│
├── app/
│   ├── api/suggest-ngo/                   # 🔀 REST endpoint (fallback scorer)
│   ├── dashboard/
│   │   ├── page.tsx                       # 🛡️ Admin Command Centre
│   │   ├── ngos/                          # 🏢 NGO Management
│   │   ├── volunteers/                    # 🙋 Volunteer Registry
│   │   ├── needs/                         # 📋 Community Needs Board
│   │   ├── field-reports/                 # 📝 Field Report Viewer
│   │   ├── dispatch/                      # 🚀 Task Dispatch Hub
│   │   ├── heatmap/                       # 🗺️ Geospatial Heatmap
│   │   ├── impact/                        # 📈 Impact Metrics
│   │   ├── missions/                      # 🎯 Volunteer Missions
│   │   └── analytics/                     # 📊 Analytics Dashboard
│   ├── login/ & signup/                   # 🔐 Auth flows
│   └── onboarding/ & ngo-onboarding/      # 🚀 Role-based onboarding
│
├── components/
│   ├── NGODashboard.tsx                   # 🏢 Full NGO experience
│   ├── EmergencyModeDialog.tsx            # 🚨 Emergency override
│   ├── MapComponent.tsx                   # 🗺️ Interactive map
│   ├── VolunteerChatbot.tsx               # 🤖 AI assistant UI
│   ├── NotificationPanel.tsx              # 🔔 Real-time alerts
│   └── LocationPicker.tsx                 # 📍 Geolocation picker
│
└── lib/
    └── firestore.ts                       # 🔥 Full Firestore layer
```

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/your-username/AidConnect.git
cd AidConnect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Firebase config, Gemini API key, Google Maps key

# Start the development server
npm run dev
# → App running on http://localhost:9002

# (Optional) Start the Genkit AI dev server
npm run genkit:dev
# → Genkit Dev UI running on http://localhost:4000
```

### Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google AI
GOOGLE_GENAI_API_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t aidconnect .

# Run the container
docker run -p 3000:3000 --env-file .env aidconnect
```

Or deploy directly to **Google Cloud Run** or **Firebase App Hosting** — we have `apphosting.yaml` ready to go.

---

## 🌍 The Mission Behind the Code

This project was built as an entry for the **Google Solution Challenge 2025** — a global competition asking developers to solve real-world UN Sustainable Development Goals using Google technology.

AidConnect addresses:
- **SDG 1** — No Poverty (Aid resource allocation)
- **SDG 3** — Good Health & Well-being (Medical emergency coordination)
- **SDG 10** — Reduced Inequalities (Last-mile community reach)
- **SDG 11** — Sustainable Cities & Communities (Disaster resilience)
- **SDG 17** — Partnerships for the Goals (NGO + Volunteer network effects)

We built this because we believe **technology has a moral responsibility** during crises. Every second of coordination delay has a human cost. We chose to build something that could matter.

---

## 🛠️ Tech Stack — The Full Picture

| Category | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI** | React 19, Tailwind CSS, shadcn/ui, Radix UI |
| **AI / ML** | Google Genkit, Gemini 1.5 Flash/Pro |
| **OCR** | Tesseract.js (browser-native) |
| **Database** | Firebase Firestore (real-time) |
| **Auth** | Firebase Authentication |
| **Maps** | Leaflet, react-leaflet, @vis.gl/react-google-maps |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Hosting** | Firebase App Hosting / Google Cloud Run |
| **State** | React Context + Firestore live subscriptions |
| **Notifications** | In-app real-time notification system |
| **i18n** | Custom multilingual switcher (5 Indian languages) |

---

## 🤝 Contributing

We welcome contributors who give a damn. If you want to help build something that matters:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please read through the `docs/blueprint.md` to understand the platform's vision before contributing.

---

<div align="center">

<br/>

```
"The measure of a civilization is how it treats its weakest members."
                                              — Mahatma Gandhi
```

<br/>

**AidConnect® — Coordination. Compassion. Action.**

*Built with 🤍 and a deep belief that technology can close the gap between need and help.*

<br/>

[![Google Solution Challenge 2025](https://img.shields.io/badge/Google_Solution_Challenge-2025-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/community/gdsc-solution-challenge)

<br/>

---

*© 2025 AidConnect. All rights reserved.*

</div>
