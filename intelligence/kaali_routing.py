<<<<<<< HEAD
"""Saheli-inspired safe-route ranking behind KAALI's internal route API.

Route geometry comes from a configured Valhalla service. Recent community reports
and mapped OSM road tags inform a relative comparison; they are not safety scores.
"""

import hashlib
import json
import math
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
=======
"""Kaali walking-route adapter and explainable community-report ranking."""

import math
import os
from datetime import datetime, timezone
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
from typing import Literal
from uuid import uuid4

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

<<<<<<< HEAD
ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

app = FastAPI(title="Kaali Safe Routing Service", version="2.0.0")

ROUTE_MODES = {
    "walking": "pedestrian",
    "pedestrian": "pedestrian",
    "bicycle": "bicycle",
    "car": "auto",
    "motorcycle": "motorcycle",
    "scooter": "motor_scooter",
    "transit": "multimodal",
}
REPORT_WEIGHTS = {
    "harassment": 1.0,
    "harassment_report": 1.0,
    "following": 1.0,
    "unsafe_path": 0.85,
    "isolated_area": 0.85,
    "blocked_road": 0.85,
    "flooding": 0.85,
    "poor_lighting": 0.7,
    "other": 0.55,
}
CONCERN_WINDOW_HOURS = 12
REPORT_SEARCH_RADIUS_M = 160
MAX_DETOUR_RATIO = 1.3


def database_path() -> Path:
    configured = os.getenv("KAALI_ROUTING_DB_PATH", "").strip()
    if not configured:
        return ROOT / ".data" / "saheli.sqlite"
    path = Path(configured).expanduser()
    return path if path.is_absolute() else ROOT / path


def open_report_db(path: Path | None = None) -> sqlite3.Connection:
    db_path = path or database_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=8)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout=8000")
    connection.execute("PRAGMA journal_mode=WAL")
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          lat REAL NOT NULL,
          lon REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          severity TEXT NOT NULL DEFAULT 'medium',
          corroboration_count INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS reports_created ON reports(created_at);
        CREATE INDEX IF NOT EXISTS reports_location_time ON reports(lat, lon, created_at);
        """
    )
    # Upgrade the original Saheli reports table in place when it is present.
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(reports)")}
    if "severity" not in columns:
        connection.execute("ALTER TABLE reports ADD COLUMN severity TEXT NOT NULL DEFAULT 'medium'")
    if "corroboration_count" not in columns:
        connection.execute("ALTER TABLE reports ADD COLUMN corroboration_count INTEGER NOT NULL DEFAULT 0")
    connection.commit()
    return connection


_REPORT_DB_PATH = database_path().resolve()
_REPORT_DB_CONNECTION: sqlite3.Connection | None = None


def report_db_connection(path: Path | None = None) -> tuple[sqlite3.Connection, bool]:
    target = (path or database_path()).expanduser().resolve()
    if target == _REPORT_DB_PATH and _REPORT_DB_CONNECTION is not None:
        return _REPORT_DB_CONNECTION, False
    return open_report_db(target), True


def ensure_report_store() -> None:
    global _REPORT_DB_CONNECTION
    if _REPORT_DB_CONNECTION is None:
        _REPORT_DB_CONNECTION = open_report_db(_REPORT_DB_PATH)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    _REPORT_DB_CONNECTION.execute("DELETE FROM reports WHERE created_at < ?", (cutoff,))
    _REPORT_DB_CONNECTION.commit()


ensure_report_store()


@app.on_event("shutdown")
def close_report_store() -> None:
    global _REPORT_DB_CONNECTION
    if _REPORT_DB_CONNECTION is not None:
        _REPORT_DB_CONNECTION.close()
        _REPORT_DB_CONNECTION = None
=======
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="Kaali Routing Service", version="1.1.0")
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c


class GeoPoint(BaseModel):
    type: Literal["Point"]
    coordinates: tuple[float, float]

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, value):
        lon, lat = value
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError("Coordinates must be [longitude, latitude]")
        return value


class RiskReport(BaseModel):
<<<<<<< HEAD
    id: str | None = None
    coordinates: tuple[float, float]
    category: str
    severity: Literal["low", "medium", "high"] = "medium"
=======
    coordinates: tuple[float, float]
    category: str
    severity: Literal["low", "medium", "high"]
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    observedAt: datetime
    corroborationCount: int = Field(default=0, ge=0)


class RouteRequest(BaseModel):
    requestId: str = Field(min_length=1, max_length=100)
    origin: GeoPoint
    destination: GeoPoint
<<<<<<< HEAD
    mode: Literal["walking", "pedestrian", "bicycle", "car", "motorcycle", "scooter", "transit"] = "walking"
=======
    mode: Literal["walking"] = "walking"
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    priority: Literal["fastest", "balanced", "lower_risk"] = "lower_risk"
    maxDetourRatio: float = Field(default=1.25, ge=1.0, le=2.5)
    departureTime: str | None = None
    riskReports: list[RiskReport] = Field(default_factory=list, max_length=200)


class GeoLineString(BaseModel):
    type: Literal["LineString"]
    coordinates: list[tuple[float, float]] = Field(min_length=2)

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, value):
        for lon, lat in value:
            if not (-180 <= lon <= 180 and -90 <= lat <= 90):
                raise ValueError("LineString coordinates must be [longitude, latitude]")
        return value


class Candidate(BaseModel):
    routeId: str
    distanceMeters: float
    durationSeconds: float
    riskScore: float | None
    riskStatus: Literal["measured", "estimated", "unknown"]
    riskConfidence: float
    riskScale: dict[str, float | bool]
    riskLabel: str
    riskExplanation: list[str]
<<<<<<< HEAD
    recommended: bool = False
=======
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    solverStatus: str
    geometry: GeoLineString
    warnings: list[str]


class RouteResponse(BaseModel):
    status: Literal["success"] = "success"
<<<<<<< HEAD
    optimizerVersion: str = "valhalla-alternatives-v1"
    roadGraphVersion: str = "configured-valhalla"
    riskModelVersion: str = "saheli-relative-concern-v1"
    routes: list[Candidate]


def distance_meters(a: dict, b: dict) -> float:
    rad = math.pi / 180
    d_lat = (b["lat"] - a["lat"]) * rad
    d_lon = (b["lon"] - a["lon"]) * rad
    h = math.sin(d_lat / 2) ** 2 + math.cos(a["lat"] * rad) * math.cos(b["lat"] * rad) * math.sin(d_lon / 2) ** 2
    return 6_371_000 * 2 * math.atan2(math.sqrt(h), math.sqrt(max(0.0, 1 - h)))


def decode_polyline(encoded: str, precision: int = 6) -> list[dict[str, float]]:
    index = lat = lon = 0
    points: list[dict[str, float]] = []
    factor = 10**precision
    while index < len(encoded):
        values = []
        for _ in range(2):
            result = shift = 0
            while True:
                if index >= len(encoded):
                    raise ValueError("Truncated route polyline")
                byte = ord(encoded[index]) - 63
                index += 1
                if byte < 0 or byte > 0x3f:
                    raise ValueError("Invalid route polyline")
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
                if shift > 60:
                    raise ValueError("Invalid route polyline")
            values.append(~(result >> 1) if result & 1 else result >> 1)
        lat += values[0]
        lon += values[1]
        point = {"lat": lat / factor, "lon": lon / factor}
        if not (-90 <= point["lat"] <= 90 and -180 <= point["lon"] <= 180):
            raise ValueError("Route polyline contains an invalid coordinate")
        points.append(point)
        if len(points) > 100_000:
            raise ValueError("Route geometry is too large")
    return points


def sample_route(points: list[dict[str, float]], count: int = 18) -> list[dict[str, float]]:
    if len(points) <= count:
        return points
    distances = [0.0]
    for index in range(1, len(points)):
        distances.append(distances[-1] + distance_meters(points[index - 1], points[index]))
    total = distances[-1]
    if total < 1:
        return [points[0]]
    samples = []
    for index in range(count):
        target = total * index / (count - 1)
        segment = next((j for j in range(1, len(distances)) if distances[j] >= target), len(distances) - 1)
        start, end = points[segment - 1], points[segment]
        span = distances[segment] - distances[segment - 1]
        ratio = (target - distances[segment - 1]) / span if span else 0.0
        samples.append({"lat": start["lat"] + (end["lat"] - start["lat"]) * ratio, "lon": start["lon"] + (end["lon"] - start["lon"]) * ratio})
    return samples


def bbox_for(points: list[dict[str, float]], margin: float = 0.003) -> tuple[float, float, float, float]:
    return (
        max(-90.0, min(p["lat"] for p in points) - margin),
        max(-180.0, min(p["lon"] for p in points) - margin),
        min(90.0, max(p["lat"] for p in points) + margin),
        min(180.0, max(p["lon"] for p in points) + margin),
    )


def persist_reports(reports: list[RiskReport], path: Path | None = None) -> None:
    if not reports:
        return
    connection, close_connection = report_db_connection(path)
    try:
        with connection:
            for report in reports:
                lon, lat = report.coordinates
                report_id = report.id or hashlib.sha256(f"{lat:.6f},{lon:.6f},{report.category},{report.observedAt.isoformat()}".encode()).hexdigest()
                observed_at = report.observedAt if report.observedAt.tzinfo else report.observedAt.replace(tzinfo=timezone.utc)
                connection.execute(
                    "INSERT OR IGNORE INTO reports(id, lat, lon, category, note, created_at, severity, corroboration_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (report_id, lat, lon, report.category, "source=kaali_approved_report", observed_at.astimezone(timezone.utc).isoformat(), report.severity, report.corroborationCount),
                )
    finally:
        if close_connection:
            connection.close()


def load_recent_reports(box: tuple[float, float, float, float], now: datetime | None = None, path: Path | None = None) -> list[dict]:
    south, west, north, east = box
    cutoff = ((now or datetime.now(timezone.utc)) - timedelta(hours=CONCERN_WINDOW_HOURS)).isoformat()
    connection, close_connection = report_db_connection(path)
    try:
        rows = connection.execute(
            "SELECT id, lat, lon, category, note, created_at, severity, corroboration_count FROM reports WHERE created_at >= ? AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 300",
            (cutoff, south, north, west, east),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        if close_connection:
            connection.close()


def report_weight(report: dict, now: datetime) -> float:
    category = report.get("category", "other")
    if category == "help_available":
        return 0.0
    relevance = REPORT_WEIGHTS.get(category, 0.0)
    try:
        created = datetime.fromisoformat(str(report["created_at"]).replace("Z", "+00:00"))
    except (KeyError, TypeError, ValueError):
        return 0.0
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age_hours = max(0.0, (now - created.astimezone(timezone.utc)).total_seconds() / 3600)
    return relevance * max(0.0, 1 - age_hours / CONCERN_WINDOW_HOURS)


def route_report_details(points: list[dict[str, float]], reports: list[dict], now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    sampled = points[::2]
    if points and (not sampled or sampled[-1] != points[-1]):
        sampled.append(points[-1])
    nearby: dict[str, dict] = {}
    for report in reports:
        point = {"lat": float(report["lat"]), "lon": float(report["lon"])}
        if any(distance_meters(point, sample) <= REPORT_SEARCH_RADIUS_M for sample in sampled):
            nearby[str(report["id"])] = report
    concern = [report for report in nearby.values() if report.get("category") != "help_available"]
    weighted = sum(report_weight(report, now) for report in concern)
    return {"reports": list(nearby.values()), "recentConcernCount": len(concern), "supportCount": sum(r.get("category") == "help_available" for r in nearby.values()), "weightedConcern": weighted}


def meters_to_segment(point: dict, start: dict, end: dict) -> float:
    scale = math.cos(math.radians(point["lat"]))
    px, py = point["lon"] * scale, point["lat"]
    ax, ay = start["lon"] * scale, start["lat"]
    bx, by = end["lon"] * scale, end["lat"]
    dx, dy = bx - ax, by - ay
    denominator = dx * dx + dy * dy
    fraction = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / denominator)) if denominator else 0.0
    return math.hypot((py - ay - fraction * dy) * 111_320, (px - ax - fraction * dx) * 111_320)


async def add_mapped_road_signals(routes: list[dict]) -> None:
    samples_by_route = [sample_route(route["points"]) for route in routes]
    samples = [point for group in samples_by_route for point in group]
    if not samples or len(samples) > 60:
        for route in routes:
            route["mapDataAvailable"] = False
        return
    query = "[out:json][timeout:12];(" + "".join(
        f'way["highway"](around:65,{point["lat"]:.5f},{point["lon"]:.5f});' for point in samples
    ) + ");out geom tags;"
    endpoint = os.getenv("OVERPASS_URL", "https://overpass.kumi.systems/api/interpreter").strip()
    try:
        timeout = float(os.getenv("OVERPASS_TIMEOUT_SECONDS", "12"))
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(endpoint, data={"data": query}, headers={"User-Agent": "KAALI/1.0 (safe route context lookup)"})
            response.raise_for_status()
            payload = response.json()
        road_segments = []
        for way in payload.get("elements", []):
            geometry = way.get("geometry")
            if not isinstance(geometry, list) or not 2 <= len(geometry) <= 1500:
                continue
            tags = way.get("tags") or {}
            for index in range(1, len(geometry)):
                road_segments.append((geometry[index - 1], geometry[index], tags))
        for route, samples in zip(routes, samples_by_route):
            lit = unlit = sidewalk = mapped = sidewalk_known = 0
            for point in samples:
                nearest = None
                nearest_distance = 65.0
                for start, end, tags in road_segments:
                    distance = meters_to_segment(point, start, end)
                    if distance < nearest_distance:
                        nearest, nearest_distance = (start, end, tags), distance
                if nearest is None:
                    continue
                mapped += 1
                tags = nearest[2]
                if str(tags.get("lit", "")).lower() in {"yes", "automatic", "24/7", "sunset-to-sunrise"}:
                    lit += 1
                elif str(tags.get("lit", "")).lower() == "no":
                    unlit += 1
                sidewalk_tag = str(tags.get("sidewalk", "")).lower()
                if sidewalk_tag:
                    sidewalk_known += 1
                if sidewalk_tag in {"yes", "both", "left", "right"} or tags.get("highway") in {"footway", "pedestrian", "living_street"}:
                    sidewalk += 1
            total = len(samples)
            route["lighting"] = {"mapped": lit + unlit, "lit": lit, "unlit": unlit, "coverage": (lit + unlit) / total if total else None, "litShare": lit / (lit + unlit) if lit + unlit else None}
            route["pedestrian"] = {"mappedPositive": sidewalk, "known": sidewalk_known, "coverage": sidewalk_known / total if total else None, "positiveShare": sidewalk / sidewalk_known if sidewalk_known else None}
            route["infrastructureCoverage"] = mapped / total if total else None
            route["mapDataAvailable"] = True
    except (httpx.HTTPError, ValueError, TypeError):
        for route in routes:
            route["mapDataAvailable"] = False


def evaluate_routes(routes: list[dict], reports_available: bool, max_detour_ratio: float) -> list[dict]:
    valid = [route for route in routes if route["lengthKm"] > 0 and len(route["points"]) >= 2]
    if not valid:
        return []
    shortest = min(route["lengthKm"] for route in valid)
    for route in valid:
        detour_km = max(0.0, route["lengthKm"] - shortest)
        detour_percent = detour_km / shortest * 100 if shortest > 0 else None
        report_exposure = route["weightedConcern"] / max(route["lengthKm"], 0.1)
        report_rate = min(1.0, report_exposure / 4) if reports_available else None
        known_lighting = route["lighting"]["lit"] + route["lighting"]["unlit"]
        lighting_concern = route["lighting"]["unlit"] / known_lighting if known_lighting else None
        can_score = reports_available or lighting_concern is not None
        relative_score = (report_rate or 0.0) * 50 + (lighting_concern or 0.0) * 20 + (detour_percent or 0.0) / max((max_detour_ratio - 1) * 100, 1) * 30 if can_score else None
        coverage = route.get("infrastructureCoverage")
        evidence = bool(route["recentConcernCount"] or known_lighting)
        reasons = []
        if route["recentConcernCount"]:
            reasons.append(f'{route["recentConcernCount"]} recent concern report(s) are nearby (unverified community reports).')
        else:
            reasons.append("No recent concern reports were found in the available report data; this is not evidence of safety.")
        if detour_percent and detour_percent > 0:
            reasons.append(f"This route is {detour_percent:.0f}% longer than the shortest candidate.")
        if known_lighting:
            reasons.append(f"OpenStreetMap has lighting tags at {known_lighting} sampled location(s); tags do not confirm working lights.")
        else:
            reasons.append("Lighting information is unavailable; missing map tags do not mean a street is unlit.")
        sidewalk_known = route.get("pedestrian", {}).get("known", 0)
        if sidewalk_known:
            reasons.append(f"OpenStreetMap has sidewalk tags at {sidewalk_known} sampled location(s); tag coverage is incomplete and unverified.")
        else:
            reasons.append("Sidewalk mapping data is unavailable for some or all sampled locations.")
        if coverage is None or coverage < 1:
            reasons.append("Mapped road coverage is incomplete for this route.")
        if not reports_available:
            reasons.append("Local report data is unavailable, so report exposure could not be assessed.")
        if evidence:
            reasons.append("Evidence confidence is a coverage heuristic and has not been statistically calibrated.")
        if relative_score is None or not evidence:
            risk_score, risk_status, risk_label = None, "unknown", "insufficient_evidence"
            confidence = 0.0
        else:
            risk_score, risk_status, risk_label = round(min(100.0, max(0.0, relative_score)), 2), "estimated", "relative_concern_index"
            confidence = min(0.9, 0.25 + (0.25 if route["recentConcernCount"] else 0) + (0.25 if known_lighting else 0) + (0.15 if coverage is not None and coverage >= 0.8 else 0))
        route.update({"detourKm": detour_km, "detourPercent": detour_percent, "relativeRiskScore": risk_score, "riskStatus": risk_status, "riskLabel": risk_label, "riskConfidence": confidence, "reasons": reasons, "hasEvidence": evidence, "recommendationEligible": route["lengthKm"] <= shortest * max_detour_ratio, "shortestKm": shortest})
    eligible = [route for route in valid if route["recommendationEligible"] and route["relativeRiskScore"] is not None]
    best = min(eligible, key=lambda route: (route["relativeRiskScore"], route["lengthKm"])) if eligible else None
    adequate = bool(eligible) and all(route["hasEvidence"] for route in valid if route["recommendationEligible"])
    for route in valid:
        route["recommended"] = bool(best and adequate and route["id"] == best["id"])
        if not adequate:
            route["explanation"] = "There is insufficient route-specific evidence to compare these alternatives confidently."
        elif route["recommended"]:
            route["explanation"] = "Lowest calculated relative concern among eligible routes. This is a comparison aid, not a safety guarantee."
        else:
            route["explanation"] = "This alternative has a higher calculated relative concern score or exceeds the detour limit; this is not a safety guarantee."
    return valid


def _route_trip(value: dict) -> dict | None:
    trip = value.get("trip") if isinstance(value, dict) else None
    if not isinstance(trip, dict):
        return None
    legs = trip.get("legs")
    summary = trip.get("summary")
    if not isinstance(legs, list) or not legs or not isinstance(legs[0], dict) or not isinstance(summary, dict):
        return None
    shape = legs[0].get("shape")
    length = summary.get("length")
    duration = summary.get("time")
    if not isinstance(shape, str) or not shape or not isinstance(length, (float, int)) or not math.isfinite(length) or length <= 0 or not isinstance(duration, (float, int)) or not math.isfinite(duration) or duration <= 0:
        return None
    try:
        points = decode_polyline(shape)
    except ValueError:
        return None
    if len(points) < 2:
        return None
    geometry = [(point["lon"], point["lat"]) for point in points]
    return {"trip": trip, "shape": shape, "lengthKm": float(length), "durationSeconds": float(duration), "points": points, "geometry": geometry}


async def valhalla_routes(request: RouteRequest) -> list[dict]:
    base_url = os.getenv("VALHALLA_BASE_URL", "https://valhalla1.openstreetmap.de").rstrip("/")
    timeout = float(os.getenv("VALHALLA_TIMEOUT_SECONDS", "20"))
    costing = ROUTE_MODES[request.mode]
    origin_lon, origin_lat = request.origin.coordinates
    destination_lon, destination_lat = request.destination.coordinates
    body = {
        "locations": [{"lat": origin_lat, "lon": origin_lon}, {"lat": destination_lat, "lon": destination_lon}],
        "costing": costing,
        "units": "kilometers",
        "language": "en",
        "directions_type": "instructions",
        "alternates": 2,
    }
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{base_url}/route", json=body, headers={"X-Client-Id": "kaali-safe-routing"})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail={"code": "ROUTING_PROVIDER_UNAVAILABLE", "message": "The configured Valhalla routing service is unavailable."}) from exc
    if not isinstance(payload, dict) or not isinstance(payload.get("trip"), dict):
        raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "Valhalla did not return a route for these points."})
    raw_routes = [payload, *(payload.get("alternates") if isinstance(payload.get("alternates"), list) else [])]
    candidates = []
    seen = set()
    for raw in raw_routes[:3]:
        option = _route_trip(raw)
        if option and option["shape"] not in seen:
            seen.add(option["shape"])
            candidates.append(option)
    if not candidates:
        raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "Valhalla returned no valid route geometry."})
    return candidates
=======
    optimizerVersion: str = "osrm-candidate-ranking-v1"
    roadGraphVersion: str = "configured-osrm"
    riskModelVersion: str = "moderated-corridor-reports-v1"
    routes: list[Candidate]


def _segment_distance_m(point, start, end):
    # Local equirectangular projection is sufficient for the small Kaali pilot area.
    lat0 = math.radians(point[1])
    scale_x = 111_320 * math.cos(lat0)
    scale_y = 110_574
    px, py = point[0] * scale_x, point[1] * scale_y
    ax, ay = start[0] * scale_x, start[1] * scale_y
    bx, by = end[0] * scale_x, end[1] * scale_y
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / max(dx * dx + dy * dy, 1e-9)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def assess_route(coordinates, reports, now=None):
    now = now or datetime.now(timezone.utc)
    matches = []
    weights = {"low": 1.0, "medium": 2.0, "high": 3.0}
    for report in reports:
        observed = report.observedAt
        if observed.tzinfo is None:
            observed = observed.replace(tzinfo=timezone.utc)
        age_days = max(0.0, (now - observed).total_seconds() / 86400)
        if age_days > 7:
            continue
        if min(_segment_distance_m(report.coordinates, a, b) for a, b in zip(coordinates, coordinates[1:])) > 75:
            continue
        freshness = max(0.0, 1.0 - age_days / 7)
        corroboration = min(1.5, 1 + report.corroborationCount * 0.15)
        category_factor = 1.0 if report.category in {"poor_lighting", "isolated_area", "harassment_report"} else 0.7
        matches.append(weights[report.severity] * freshness * corroboration * category_factor)
    if not matches:
        return None, "unknown", 0.0, "unknown", ["No recent, moderated report matched this route corridor; unknown does not mean safe."], []
    # Monotonic bounded index: larger/repeated recent hazards increase the score.
    score = min(100.0, round(100 * (1 - math.exp(-sum(matches) / 5)), 1))
    confidence = min(0.9, round(0.25 + len(matches) * 0.15, 2))
    return score, "estimated", confidence, "estimated_report_index", [
        f"{len(matches)} recent moderated report(s) matched within 75 m of the route.",
        "Index uses report severity, freshness and corroboration; it is not a prediction or safety guarantee.",
    ], matches
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c


@app.get("/internal/health")
async def health():
<<<<<<< HEAD
    try:
        ensure_report_store()
        db_available = True
    except sqlite3.Error:
        db_available = False
    return {"status": "configured" if db_available else "degraded", "provider": "Valhalla + OpenStreetMap", "database": "wal_sqlite" if db_available else "unavailable", "routeProvider": os.getenv("VALHALLA_BASE_URL", "https://valhalla1.openstreetmap.de")}
=======
    configured = bool(os.getenv("OSRM_BASE_URL", "").strip() and os.getenv("OSRM_PROFILE", "").strip())
    return {"status": "configured" if configured else "routing_unconfigured", "provider": "OSRM", "profile": os.getenv("OSRM_PROFILE") or None}
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c


@app.post("/internal/route/optimize", response_model=RouteResponse)
async def optimize_route(request: RouteRequest) -> RouteResponse:
<<<<<<< HEAD
    try:
        persist_reports(request.riskReports)
        options = await valhalla_routes(request)
        all_points = [point for route in options for point in route["points"]]
        reports_available = True
        try:
            reports = load_recent_reports(bbox_for(all_points))
        except sqlite3.Error:
            reports, reports_available = [], False
        now = datetime.now(timezone.utc)
        prepared = []
        for option in options:
            details = route_report_details(option["points"], reports, now)
            prepared.append({**option, **details, "id": hashlib.sha256(option["shape"].encode()).hexdigest()[:16], "lighting": {"mapped": 0, "lit": 0, "unlit": 0, "coverage": None, "litShare": None}, "pedestrian": {"mappedPositive": 0, "known": 0, "coverage": None, "positiveShare": None}, "infrastructureCoverage": None, "mapDataAvailable": False})
        await add_mapped_road_signals(prepared)
        evaluated = evaluate_routes(prepared, reports_available, request.maxDetourRatio)
        if not evaluated:
            raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "No valid route candidate could be evaluated."})
        if request.priority == "fastest":
            evaluated.sort(key=lambda route: (route["durationSeconds"], route["lengthKm"]))
        elif request.priority == "balanced":
            evaluated.sort(key=lambda route: (route["durationSeconds"], route["lengthKm"]))
        else:
            evaluated.sort(key=lambda route: (not route["recommended"], route["relativeRiskScore"] if route["relativeRiskScore"] is not None else math.inf, route["lengthKm"]))
        result = []
        for index, route in enumerate(evaluated):
            warnings = []
            if not route["hasEvidence"]:
                warnings.append("Insufficient route-specific evidence; risk is unknown, not zero.")
            if not route["mapDataAvailable"]:
                warnings.append("OpenStreetMap infrastructure data is unavailable for this route.")
            if not route["recentConcernCount"]:
                warnings.append("No recent concern report was found in the available data; this does not mean the route is safe.")
            explanations = [route["explanation"], *route["reasons"]]
            result.append(Candidate(
                routeId=f"valhalla-{route['id']}-{index + 1}",
                distanceMeters=route["lengthKm"] * 1000,
                durationSeconds=route["durationSeconds"],
                riskScore=route["relativeRiskScore"],
                riskStatus=route["riskStatus"],
                riskConfidence=route["riskConfidence"],
                riskScale={"min": 0, "max": 100, "higherIsRiskier": True},
                riskLabel=route["riskLabel"],
                riskExplanation=explanations,
                recommended=route["recommended"],
                solverStatus="FEASIBLE",
                geometry=GeoLineString(type="LineString", coordinates=route["geometry"]),
                warnings=warnings,
            ))
        return RouteResponse(
            optimizerVersion="valhalla-alternates-v1",
            roadGraphVersion="valhalla-configured-graph",
            riskModelVersion="saheli-relative-concern-v1",
            routes=result,
        )
    except HTTPException:
        raise
    except (sqlite3.Error, OSError, ValueError) as exc:
        raise HTTPException(status_code=503, detail={"code": "SAFE_ROUTING_UNAVAILABLE", "message": "The safe-routing service could not access its report store or route providers."}) from exc
=======
    base_url = os.getenv("OSRM_BASE_URL", "").rstrip("/")
    profile = os.getenv("OSRM_PROFILE", "").strip()
    if not base_url or not profile:
        raise HTTPException(status_code=503, detail={"code": "ROUTING_NOT_CONFIGURED", "message": "Configure OSRM_BASE_URL and a supported OSRM_PROFILE (for walking, the deployment must use a walking graph)."})
    try:
        timeout = float(os.getenv("OSRM_TIMEOUT_SECONDS", "8"))
        if timeout <= 0:
            raise ValueError("timeout must be positive")
    except ValueError as exc:
        raise HTTPException(status_code=503, detail={"code": "ROUTING_CONFIGURATION_INVALID", "message": "OSRM_TIMEOUT_SECONDS must be positive."}) from exc
    origin, destination = request.origin.coordinates, request.destination.coordinates
    coordinates = f"{origin[0]},{origin[1]};{destination[0]},{destination[1]}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    if os.getenv("OSRM_ALTERNATIVES", "false").lower() in {"true", "1", "yes"}:
        params["alternatives"] = "true"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{base_url}/route/v1/{profile}/{coordinates}", params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail={"code": "ROUTING_PROVIDER_UNAVAILABLE", "message": "The configured routing provider could not return a valid response."}) from exc
    if not isinstance(payload, dict) or payload.get("code") != "Ok" or not isinstance(payload.get("routes"), list) or not payload["routes"]:
        raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "The configured routing provider found no route."})
    try:
        waypoints = payload.get("waypoints")
        if not isinstance(waypoints, list) or len(waypoints) != 2 or any(not isinstance(w, dict) or not isinstance(w.get("distance"), (int, float)) for w in waypoints):
            raise ValueError("missing OSRM snap metadata")
        max_snap = float(os.getenv("OSRM_MAX_SNAP_DISTANCE_METERS", "250"))
        if max_snap <= 0:
            raise HTTPException(status_code=503, detail={"code": "ROUTING_CONFIGURATION_INVALID", "message": "OSRM_MAX_SNAP_DISTANCE_METERS must be positive."})
        if any(float(w["distance"]) > max_snap for w in waypoints):
            raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "Origin or destination is too far from a routable walking network point."})
        valid = [r for r in payload["routes"] if isinstance(r, dict) and isinstance(r.get("distance"), (int, float)) and math.isfinite(float(r["distance"])) and float(r["distance"]) >= 0 and isinstance(r.get("duration"), (int, float)) and math.isfinite(float(r["duration"])) and float(r["duration"]) >= 0 and isinstance(r.get("geometry"), dict) and isinstance(r["geometry"].get("coordinates"), list) and len(r["geometry"]["coordinates"]) >= 2]
        if not valid:
            raise ValueError("no valid route geometry")
        baseline = min(float(r["distance"]) for r in valid)
        candidates = []
        for index, route in enumerate(valid):
            distance = float(route["distance"])
            if distance > baseline * request.maxDetourRatio:
                continue
            points = route["geometry"]["coordinates"]
            if any(not isinstance(p, list) or len(p) != 2 or not all(isinstance(v, (int, float)) for v in p) for p in points):
                continue
            coordinates_out = [(float(p[0]), float(p[1])) for p in points]
            risk_score, risk_status, confidence, label, explanation, hazard_weights = assess_route(coordinates_out, request.riskReports)
            warnings = [] if risk_score is not None else ["Risk data is unknown; this route is not confirmed safe."]
            candidates.append(Candidate(routeId=f"osrm-{uuid4().hex[:12]}-{index + 1}", distanceMeters=distance, durationSeconds=float(route["duration"]), riskScore=risk_score, riskStatus=risk_status, riskConfidence=confidence, riskScale={"min": 0, "max": 100, "higherIsRiskier": True}, riskLabel=label, riskExplanation=explanation, solverStatus="FEASIBLE", geometry=GeoLineString(type="LineString", coordinates=coordinates_out), warnings=warnings))
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=503, detail={"code": "ROUTING_RESPONSE_INVALID", "message": "The configured routing provider returned an invalid route response."}) from exc
    if not candidates:
        raise HTTPException(status_code=422, detail={"code": "NO_FEASIBLE_ROUTE", "message": "No valid route geometry satisfies the configured detour limit."})
    if request.priority == "fastest":
        candidates.sort(key=lambda r: r.durationSeconds)
    elif request.priority == "balanced":
        candidates.sort(key=lambda r: (r.durationSeconds, r.distanceMeters))
    elif any(r.riskScore is not None for r in candidates):
        candidates.sort(key=lambda r: (r.riskScore if r.riskScore is not None else 101, r.distanceMeters))
    else:
        candidates.sort(key=lambda r: (r.distanceMeters, r.durationSeconds))
    return RouteResponse(routes=candidates)
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
