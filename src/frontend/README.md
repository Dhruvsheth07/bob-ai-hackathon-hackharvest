# Port Operations Optimizer - Frontend

This is the frontend dashboard for the Port Operations Optimizer, built with **React 18**, **Vite**, and **TailwindCSS**.

## Features
- **Dashboard Overview:** Monitor high-level port operations, including incoming vessels and pending recommendations.
- **Vessel Schedules:** Interactive interface to view and manage vessel schedules and priorities.
- **Operations Planning:** View generated berth and crane allocation plans from the OR-Tools optimizer.
- **Congestion Predictions:** Visualize AI-driven congestion forecasts and risk levels to proactively manage port traffic.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A running instance of the FastAPI backend

### Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd src/frontend
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Environment Variables

The frontend connects to the backend API using the `VITE_API_BASE_URL` environment variable. By default, the API client connects to `http://localhost:8000/api/v1`. If you need to change this, create a `.env` file in the `src/frontend` directory:

```env
VITE_API_BASE_URL=http://your-backend-url/api/v1
```
