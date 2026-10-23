# KAALI safe-routing intelligence

This FastAPI service is called by the Express route API at `POST /internal/route/optimize`. It requests a Valhalla route and alternatives, compares recent community reports and mapped OpenStreetMap road tags, then returns the route-candidate contract expected by `server/src/services/routing.service.ts`.

## Run locally

```powershell
cd intelligence
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn kaali_routing:app --host 127.0.0.1 --port 8000
```

The service creates `.data/saheli.sqlite` on first start and enables SQLite WAL journaling. The `.data/` directory is ignored by Git. `KAALI_ROUTING_DB_PATH` can point to a different database; existing Saheli `reports` tables are upgraded with severity and corroboration columns when needed.

Configure `VALHALLA_BASE_URL` for a Valhalla instance with the requested costing profile. `OVERPASS_URL` supplies optional mapped lighting and pedestrian-infrastructure context. Both public endpoints in `.env.example` are best effort and should be replaced with operated services for production.

The API uses only approved reports sent by KAALI's backend plus recent reports already present in its local SQLite store. Reports are treated as unverified observations. The relative concern index uses recent report exposure, observed unlit OpenStreetMap tags, and detour length. A route is recommended only when every eligible alternative has route-specific report or mapped-lighting evidence. Missing evidence is returned as unknown and never as zero risk. The comparison is not a safety guarantee.

The route endpoint accepts the existing KAALI request fields: `origin`, `destination`, `mode`, `priority`, `maxDetourRatio`, and `riskReports`. The browser continues to call the versioned Express API; it does not call this internal service directly.
