# Solution Overview

## What We Built
We are building a predictive port operations decision-support system that helps port operators identify congestion before it happens and decide how to respond.

The system combines vessel schedules, berth availability, crane capacity, and operational constraints to forecast congestion over the next 72 hours. When a bottleneck is detected, it recommends practical actions such as moving a vessel to another berth or reallocating cranes. It then generates an optimized 72-hour operating plan that supervisors can review and approve.

The goal is not to replace port operators. Instead, the system gives them a data-driven plan before congestion becomes a problem, reducing manual planning effort and avoidable vessel waiting time.

## How It Works

1.Port data is entered into the system
Vessel schedules, vessel characteristics, available berths, cranes, and operational capacity are stored in the system.
2. The system evaluates upcoming port conditions
It calculates factors such as berth utilization, crane utilization, vessel arrival pressure, and expected resource demand.
3. Congestion is predicted
A congestion engine assigns a risk score to future time periods and identifies when a berth, crane group, or the port as a whole is likely to become overloaded.
4. The optimizer evaluates possible schedules
The system considers vessel ETAs, berth dimensions, crane availability, service times, priorities, and operational constraints to find a feasible resource allocation.
5. Actionable recommendations are generated
Instead of only showing a warning, the system explains what the supervisor can do—for example, move a vessel from one berth to another or change crane allocation.
6. A 72-hour operations plan is generated
The optimized berth assignments, crane assignments, vessel service windows, and high-risk periods are combined into a shift-ready operating plan.
7. Supervisors can review and act
Recommendations and plans can be accepted, rejected, or adjusted, with changes recorded for operational traceability.

## Architecture Diagram
                         ┌───────────────────────┐
                         │   Port Operations     │
                         │       Supervisor      │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      React.js UI       │
                         │ Dashboard / Plans /   │
                         │ Alerts / Visualization│
                         └───────────┬───────────┘
                                     │
                                  REST API
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FastAPI         │
                         │ API + Auth + RBAC      │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌────────────────┐    ┌─────────────────┐    ┌────────────────┐
     │  Congestion    │    │  Optimization   │    │ Recommendation │
     │   Predictor    │    │     Engine      │    │     Engine     │
     │ Rule/ML Model  │    │   OR-Tools      │    │ Explainable    │
     └────────┬───────┘    └────────┬────────┘    └───────┬────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                         ┌───────────────────────┐
                         │      PostgreSQL       │
                         │ Vessels / Berths /    │
                         │ Cranes / Schedules /  │
                         │ Predictions / Plans   │
                         └───────────────────────┘

## Key Design Decisions

| Decision | Rationale |
| Decision                                                           | Rationale
| **Prediction + Optimization instead of dashboard-only monitoring** | A dashboard tells operators what is happening; our system also predicts what is likely to happen and recommends what to do about it.                                                                           |
| **Google OR-Tools for berth/crane optimization**                   | Berth and crane scheduling has many hard constraints. OR-Tools provides a practical constraint-optimization engine suitable for the MVP without building a custom solver.                                      |
| **Hybrid congestion prediction**                                   | V1 uses a transparent weighted congestion score so the system works with limited historical data. An ML model such as XGBoost can be added later as more operational data becomes available.                   |
| **72-hour planning horizon**                                       | Three days is long enough to identify upcoming bottlenecks while remaining operationally useful for shift supervisors.                                                                                         |
| **Explainable recommendations**                                    | Operators need to understand *why* the system recommends moving a vessel or reallocating cranes. The system therefore exposes the reason and expected impact rather than only returning an optimized schedule. |
| **PostgreSQL as the operational data store**                       | Vessel schedules, resources, predictions, optimization results, recommendations, and audit information are highly relational, making PostgreSQL a strong fit for the MVP.                                      |
| **No external API dependency in V1**                               | The MVP can operate using port-provided or simulated data, avoiding API costs and reducing the risk of an external service breaking a live demonstration.                                                      |
| **Human-in-the-loop operations**                                   | The system recommends and optimizes; the supervisor remains responsible for approving operational changes.                                                                                                     |

## IBM Technologies Used

[Explain specifically HOW you used each IBM technology — not just that you used it.]

- **[IBM Tech 1, e.g., watsonx.ai]:** [How it was used — e.g., "Used the `ibm/granite-13b-instruct-v2` model via the Python SDK to classify anomaly types from log text."]
- **[IBM Tech 2]:** [How it was used]
