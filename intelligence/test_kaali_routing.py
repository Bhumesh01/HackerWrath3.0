import os
<<<<<<< HEAD
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from pydantic import ValidationError

from intelligence.kaali_routing import (
    RiskReport,
    RouteRequest,
    decode_polyline,
    evaluate_routes,
    open_report_db,
    optimize_route,
    report_weight,
)


def encode_polyline(points):
    output = []
    previous_lat = previous_lon = 0
    for lat, lon in points:
        current_lat, current_lon = round(lat * 1_000_000), round(lon * 1_000_000)
        for value in (current_lat - previous_lat, current_lon - previous_lon):
            value = ~(value << 1) if value < 0 else value << 1
            while value >= 0x20:
                output.append(chr((0x20 | (value & 0x1F)) + 63))
                value >>= 5
            output.append(chr(value + 63))
        previous_lat, previous_lon = current_lat, current_lon
    return "".join(output)


SHAPE = encode_polyline([(31.634, 74.872), (31.637, 74.876), (31.640, 74.881)])


def run_immediate(coroutine):
    """Run a coroutine composed only of immediate async fakes (no event loop/socket)."""
    try:
        coroutine.send(None)
    except StopIteration as done:
        return done.value
    raise AssertionError("mocked route flow unexpectedly attempted asynchronous I/O")


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

=======
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from datetime import datetime, timedelta, timezone

from intelligence.kaali_routing import RiskReport, RouteRequest, assess_route, optimize_route


class FakeResponse:
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    def raise_for_status(self):
        return None

    def json(self):
<<<<<<< HEAD
        return self.payload
=======
        return {
            "code": "Ok",
            "waypoints": [{"distance": 4}, {"distance": 8}],
            "routes": [
                {"distance": 1200, "duration": 600, "geometry": {"coordinates": [[74.872, 31.634], [74.881, 31.640]]}},
                {"distance": 1450, "duration": 510, "geometry": {"coordinates": [[74.872, 31.634], [74.876, 31.637], [74.881, 31.640]]}},
            ],
        }
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c


class FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

<<<<<<< HEAD
    async def post(self, url, **kwargs):
        if url.endswith("/route"):
            return FakeResponse({"trip": {"legs": [{"shape": SHAPE}], "summary": {"length": 1.2, "time": 600}}})
        return FakeResponse({"elements": [{"geometry": [{"lat": 31.634, "lon": 74.872}, {"lat": 31.640, "lon": 74.881}], "tags": {"highway": "footway", "lit": "no", "sidewalk": "yes"}}]})


def make_request(risk_reports=None):
=======
    async def get(self, *args, **kwargs):
        return FakeResponse()


def request(priority="lower_risk"):
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    return RouteRequest(
        requestId="test-request",
        origin={"type": "Point", "coordinates": [74.872, 31.634]},
        destination={"type": "Point", "coordinates": [74.881, 31.640]},
<<<<<<< HEAD
        riskReports=risk_reports or [],
    )


class KaaliSafeRoutingTests(unittest.TestCase):
    async def call_optimizer(self, risk_reports=None):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent / ".data") as directory:
            db_path = str(Path(directory) / ".data" / "saheli.sqlite")
            with patch.dict(os.environ, {"VALHALLA_BASE_URL": "https://valhalla.test", "OVERPASS_URL": "https://overpass.test/interpreter", "KAALI_ROUTING_DB_PATH": db_path}), patch("intelligence.kaali_routing.httpx.AsyncClient", FakeAsyncClient):
                return await optimize_route(make_request(risk_reports))

    def test_valhalla_geometry_and_osm_signals_match_backend_contract(self):
        response = run_immediate(self.call_optimizer())
        route = response.routes[0]
        self.assertEqual(route.geometry.type, "LineString")
        self.assertEqual(route.geometry.coordinates[0], (74.872, 31.634))
        self.assertEqual(route.riskStatus, "estimated")
        self.assertGreater(route.riskScore, 0)
        self.assertIn("OpenStreetMap has lighting tags", " ".join(route.riskExplanation))
        self.assertEqual(response.riskModelVersion, "saheli-relative-concern-v1")

    def test_approved_kaali_reports_are_persisted_in_wal_database_and_used(self):
        report = RiskReport(id="approved-report-1", coordinates=(74.872, 31.634), category="harassment_report", severity="high", observedAt=datetime.now(timezone.utc), corroborationCount=2)
        response = run_immediate(self.call_optimizer([report]))
        self.assertGreater(response.routes[0].riskScore, 20)
        self.assertTrue(any("recent concern report" in text for text in response.routes[0].riskExplanation))

    def test_route_without_report_or_map_evidence_stays_unknown(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent / ".data") as directory:
            db_path = str(Path(directory) / "saheli.sqlite")

            class NoSignalsClient(FakeAsyncClient):
                async def post(self, url, **kwargs):
                    if url.endswith("/route"):
                        return FakeResponse({"trip": {"legs": [{"shape": SHAPE}], "summary": {"length": 1.2, "time": 600}}})
                    return FakeResponse({"elements": []})

            with patch.dict(os.environ, {"VALHALLA_BASE_URL": "https://valhalla.test", "OVERPASS_URL": "https://overpass.test/interpreter", "KAALI_ROUTING_DB_PATH": db_path}), patch("intelligence.kaali_routing.httpx.AsyncClient", NoSignalsClient):
                response = run_immediate(optimize_route(make_request()))
        self.assertIsNone(response.routes[0].riskScore)
        self.assertEqual(response.routes[0].riskStatus, "unknown")
        self.assertTrue(any("Insufficient" in warning for warning in response.routes[0].warnings))

    def test_provider_failure_is_reported_as_unavailable(self):
        class FailingClient(FakeAsyncClient):
            async def post(self, url, **kwargs):
                request = httpx.Request("POST", url)
                raise httpx.ConnectError("offline", request=request)

        with patch.dict(os.environ, {"VALHALLA_BASE_URL": "https://valhalla.test"}), patch("intelligence.kaali_routing.httpx.AsyncClient", FailingClient):
            with self.assertRaises(HTTPException) as caught:
                run_immediate(optimize_route(make_request()))
        self.assertEqual(caught.exception.status_code, 503)

    def test_wal_database_has_saheli_report_schema_and_sidecar_mode(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent / ".data") as directory:
            path = Path(directory) / ".data" / "saheli.sqlite"
            connection = open_report_db(path)
            try:
                columns = {row["name"] for row in connection.execute("PRAGMA table_info(reports)")}
                mode = connection.execute("PRAGMA journal_mode").fetchone()[0]
            finally:
                connection.close()
        self.assertTrue({"id", "lat", "lon", "category", "note", "created_at", "severity", "corroboration_count"}.issubset(columns))
        self.assertEqual(mode.lower(), "wal")

    def test_freshness_decay_and_relative_route_recommendation(self):
        now = datetime.now(timezone.utc)
        recent = {"category": "poor_lighting", "created_at": now.isoformat()}
        old = {"category": "poor_lighting", "created_at": (now - timedelta(hours=12)).isoformat()}
        self.assertGreater(report_weight(recent, now), 0)
        self.assertEqual(report_weight(old, now), 0)
        routes = [
            {"id": "a", "lengthKm": 1.0, "durationSeconds": 600, "points": [{}, {}], "weightedConcern": 2.0, "recentConcernCount": 1, "supportCount": 0, "lighting": {"mapped": 1, "lit": 1, "unlit": 0}, "infrastructureCoverage": 1.0},
            {"id": "b", "lengthKm": 1.1, "durationSeconds": 660, "points": [{}, {}], "weightedConcern": 0.0, "recentConcernCount": 0, "supportCount": 0, "lighting": {"mapped": 1, "lit": 1, "unlit": 0}, "infrastructureCoverage": 1.0},
        ]
        evaluated = evaluate_routes(routes, reports_available=True, max_detour_ratio=1.3)
        self.assertEqual([route["id"] for route in evaluated if route["recommended"]], ["b"])

    def test_polyline_keeps_latitude_longitude_decode_order(self):
        points = decode_polyline(SHAPE)
        self.assertAlmostEqual(points[0]["lat"], 31.634)
        self.assertAlmostEqual(points[0]["lon"], 74.872)

    def test_invalid_coordinate_ranges_are_rejected(self):
        with self.assertRaises(ValidationError):
            RouteRequest(requestId="bad", origin={"type": "Point", "coordinates": [200, 74.872]}, destination={"type": "Point", "coordinates": [74.881, 31.640]})
=======
        priority=priority,
    )


class KaaliRoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_provider_candidates_are_ranked_and_keep_geojson_order(self):
        with patch.dict(os.environ, {"OSRM_BASE_URL": "http://osrm.test", "OSRM_PROFILE": "walking"}), patch("intelligence.kaali_routing.httpx.AsyncClient", FakeAsyncClient):
            result = await optimize_route(request("fastest"))
        self.assertEqual(result.routes[0].durationSeconds, 510)
        self.assertEqual(result.routes[0].geometry.coordinates[0], (74.872, 31.634))
        self.assertIsNone(result.routes[0].riskScore)
        self.assertEqual(result.routes[0].riskStatus, "unknown")
        self.assertIn("unknown", result.routes[0].warnings[0])

    async def test_missing_provider_is_a_clear_configuration_error(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(HTTPException) as caught:
                await optimize_route(request())
        self.assertEqual(caught.exception.status_code, 503)

    def test_invalid_coordinate_ranges_are_rejected(self):
        with self.assertRaises(ValidationError):
            RouteRequest(
                requestId="bad",
                origin={"type": "Point", "coordinates": [200, 74.872]},
                destination={"type": "Point", "coordinates": [74.881, 31.640]},
            )

    def test_recent_relevant_moderated_hazard_increases_route_score(self):
        route = [(74.872, 31.634), (74.881, 31.640)]
        report = RiskReport(coordinates=(74.876, 31.637), category="poor_lighting", severity="high", observedAt=datetime.now(timezone.utc), corroborationCount=2)
        score, status, confidence, _, explanation, _ = assess_route(route, [report])
        self.assertGreater(score, 0)
        self.assertEqual(status, "estimated")
        self.assertGreater(confidence, 0)
        self.assertIn("1 recent moderated", explanation[0])

    def test_old_and_off_corridor_reports_do_not_create_risk_claim(self):
        route = [(74.872, 31.634), (74.881, 31.640)]
        old = RiskReport(coordinates=(74.876, 31.637), category="poor_lighting", severity="high", observedAt=datetime.now(timezone.utc) - timedelta(days=8))
        distant = RiskReport(coordinates=(74.9, 31.7), category="harassment_report", severity="high", observedAt=datetime.now(timezone.utc))
        result = assess_route(route, [old, distant])
        self.assertIsNone(result[0])
        self.assertEqual(result[1], "unknown")
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c


if __name__ == "__main__":
    unittest.main()
