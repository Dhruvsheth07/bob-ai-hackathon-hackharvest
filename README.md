# 🚀 PortFlow AI

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | hackharvest |
| **Track** | Sustainability |
| **Team Lead** | Dhruv Sheth — 24dce133@charusat.edu.in |
| **Members** | Patel Ankit , Patel Yug , Solanki Aryant |

---

## 🎯 Problem Statement

>  Port operators nowadays use spreadsheers to manage all the port operations which give unnecessary manual overhead such as struggle to predict congestion and efficiently allocate berths, cranes, and yard capacity because vessel arrivals, resource availability, and service times are constantly changing.This process is very human error prone and inefficient since , once the issue is occured then the staff realises it .So on-spot remediation is tough for them .



---

## 💡 Solution

> PortFlow AI is decision-support and managing platform that forecasts port congestion using vessel schedules and operational capacity data, then uses constraint optimization to generate feasible berth and crane assignments. It provides congestion alerts in prior, explainable operational recommendations, and a 72-hour planning view to help supervisors make faster data-driven scheduling decisions.

---

## ✨ Key Features

- **Congestion Forecasting:** Rule-based prediction engine that calculates congestion scores and risk levels based on live operational data.
- **Automated Optimization:** Google OR-Tools CP-SAT generates 72-hour operation plans, producing optimal assignments for berth and crane allocations.
- **Actionable Recommendations:** Delivers intelligent insights for operational supervisors, advising on rerouting and priority adjustments.
- **Dynamic Dashboard:** A rich React.js/Vite interface providing a real-time overview of vessel schedules and congestion alerts.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, Javascript, SQL  |
| **Frameworks** | FastAPI, React.js, Tailwind CSS,  SQLAlchemy |
| **IBM Technologies** | IBM Bob |
| **Databases** | PostgreSQL |
| **Other** | Google OR-Tools CP-SAT, sklearn, pandas,numpy

---

## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Detailed instructions are available in [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repository
git clone https://github.com/Dhruvsheth07/bob-ai-hackathon-hackharvest.git
cd bob-ai-hackathon-hackharvest

# 2. Install backend dependencies
cd src
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Set up database and seed user
cp .env.example .env
alembic upgrade head
python seed_admin.py

# 5. Run the application
# Terminal 1 (Backend - from the src directory):
uvicorn app.main:app --reload --port 8000 

# Terminal 2 (Frontend - from the src/frontend directory):
npm run dev
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

>The current MVP uses synthetic or simulated operational data and does not yet integrate live AIS vessel feeds, real-time port systems, or weather data. Congestion forecasts are intended for operational decision support, not as a replacement for human supervisor judgment. Advanced multi-port routing, full yard optimization, and real-time streaming are planned for future versions.

---

## 🏅 What We're Most Proud Of

Our strongest contribution is the integration of predictive analytics
     with constraint-based optimization. Instead of only displaying congestion
     predictions, the platform converts those predictions into actionable
     berth and crane schedules and a 72-hour operations plan. This creates a
     practical bridge between AI-based forecasting and real-world port
     decision-making.

---
