# KAALI

KAALI is a safety-aware route planning application with a React client, an Express API, and a FastAPI intelligence service. The API uses MongoDB for application data; the intelligence service creates a local SQLite cache for recent route reports.

## Safe routing: local setup

### 1. Configure the API

In `server/`, copy `.env.example` to `.env`. Set `MONGODB_URI` to the MongoDB connection string you use with MongoDB Compass, and set `CORS_ORIGIN` to the client origin (the Vite default is `http://localhost:5173`). Keep `.env` private and do not commit it.

The application currently uses anonymous browser scope IDs; there is no sign-in step for route requests.

### 2. Configure the intelligence service

In `intelligence/`, copy `.env.example` to `.env`. Review `VALHALLA_BASE_URL` and `OVERPASS_URL`; the sample public providers are best effort. `server/.env` should point `PYTHON_ROUTING_URL` to the intelligence service, normally `http://localhost:8000`.

The SQLite database defaults to `intelligence/.data/saheli.sqlite`. The FastAPI service creates the `.data/` directory and database on first startup and enables SQLite WAL mode. SQLite may create `saheli.sqlite-wal` and `saheli.sqlite-shm` alongside the database while it is open. These are runtime files; `.data/` is ignored by Git. You do not need to create the database or sidecar files by hand. To use an existing Saheli database, set `KAALI_ROUTING_DB_PATH` in `intelligence/.env` to its path.

### 3. Configure the client

In `client/`, copy `.env.example` to `.env.local` and set `VITE_API_URL` to the Express API, normally `http://localhost:5000/api/v1`. Map display uses the configured/default map style; route generation also requires the Valhalla provider.

### 4. Install and run the services

Run each service in a separate PowerShell terminal from the repository root.

Express API:

```powershell
cd server
npm install
npm run dev
```

Safe-routing intelligence service:

```powershell
cd intelligence
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn kaali_routing:app --host 127.0.0.1 --port 8000
```

React client:

```powershell
cd client
npm install
npm run dev
```

Create each `.env` file before starting its service and adjust its values as needed. If PowerShell blocks virtual-environment activation, use `python -m pip install -r requirements.txt` and `python -m uvicorn ...` without activating it.

### 5. How a route request flows

The client sends origin, destination, travel mode, and route preferences to `POST /api/v1/routes` on Express. Express loads eligible approved reports from MongoDB and forwards the request to FastAPI at `POST /internal/route/optimize`. FastAPI obtains a Valhalla route and alternatives, compares recent report exposure with optional OpenStreetMap lighting and pedestrian-road tags, then returns route candidates. Express responds to the client, which displays the route geometry, recommendation, and explanations.

The route comparison is relative and evidence-based. Missing reports or map tags are treated as unknown, not proof of safety. A recommendation is not a safety guarantee. Public routing and map-context endpoints in the sample configuration may be unavailable; use operated providers for production.

For the detailed configuration, API smoke request, scoring explanation, and limits, see [the safe-routing setup guide](docs/kaali-navigation-setup.md) and [the intelligence service README](intelligence/README.md).
