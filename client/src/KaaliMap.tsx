import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, type GeoJSONSource } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

export type RouteGeometry = { type: 'LineString'; coordinates: [number, number][] };
type Coordinate = { latitude: number; longitude: number } | null;
<<<<<<< HEAD
type Props = { origin: Coordinate; destination: Coordinate; route: RouteGeometry | null; alternatives?: RouteGeometry[]; reports?: { location: { latitude: number; longitude: number }; category: string }[]; currentPosition: Coordinate };
const STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL?.trim() || 'https://tiles.openfreemap.org/styles/liberty';
const ROUTE_SOURCE = 'kaali-route';

export default function KaaliMap({ origin, destination, route, alternatives = [], reports = [], currentPosition }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const latestRoute = useRef<RouteGeometry | null>(route);
  const latestAlternatives = useRef<RouteGeometry[]>(alternatives);
  const markers = useRef<{ origin: Marker | null; destination: Marker | null; current: Marker | null; reports: Marker[] }>({ origin: null, destination: null, current: null, reports: [] });
  const [mapError, setMapError] = useState('');
=======
type Props = { origin: Coordinate; destination: Coordinate; route: RouteGeometry | null; currentPosition: Coordinate };
const STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL as string | undefined;
const ROUTE_SOURCE = 'kaali-route';

export default function KaaliMap({ origin, destination, route, currentPosition }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const latestRoute = useRef<RouteGeometry | null>(route);
  const markers = useRef<{ origin: Marker | null; destination: Marker | null; current: Marker | null }>({ origin: null, destination: null, current: null });
  const [mapError, setMapError] = useState(STYLE_URL ? '' : 'Set VITE_MAP_STYLE_URL to a valid hosted style to load the map.');
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c

  useEffect(() => {
    if (!container.current) return;
    if (!STYLE_URL) return;
    const instance = new MapLibreMap({ container: container.current, style: STYLE_URL, center: [-73.9855, 40.7580], zoom: 13 });
    const markerRefs = markers.current;
    map.current = instance;
    const resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(container.current);
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    instance.on('error', () => setMapError('Map style or tiles could not be loaded. Check the configured map provider.'));
    instance.on('load', () => {
      instance.addSource(ROUTE_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
<<<<<<< HEAD
      instance.addLayer({ id: 'kaali-route-alternatives', type: 'line', source: ROUTE_SOURCE, filter: ['==', ['get', 'selected'], false], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#91a89a', 'line-width': 4, 'line-opacity': 0.78, 'line-dasharray': [2, 1.5] } });
      instance.addLayer({ id: 'kaali-route-casing', type: 'line', source: ROUTE_SOURCE, filter: ['==', ['get', 'selected'], true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffaf2', 'line-width': 10, 'line-opacity': 0.95 } });
      instance.addLayer({ id: 'kaali-route-line', type: 'line', source: ROUTE_SOURCE, filter: ['==', ['get', 'selected'], true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#256b58', 'line-width': 5, 'line-opacity': 0.98 } });
      const loadedRoute = latestRoute.current;
      if (loadedRoute) {
        (instance.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(loadedRoute, latestAlternatives.current));
=======
      instance.addLayer({ id: 'kaali-route-casing', type: 'line', source: ROUTE_SOURCE, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffaf2', 'line-width': 10, 'line-opacity': 0.95 } });
      instance.addLayer({ id: 'kaali-route-line', type: 'line', source: ROUTE_SOURCE, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#256b58', 'line-width': 5, 'line-opacity': 0.98 } });
      const loadedRoute = latestRoute.current;
      if (loadedRoute) {
        (instance.getSource(ROUTE_SOURCE) as GeoJSONSource).setData({ type: 'Feature', properties: {}, geometry: loadedRoute });
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
        const first = loadedRoute.coordinates[0];
        if (first) {
          const bounds = loadedRoute.coordinates.reduce((current, coord) => current.extend(coord), new LngLatBounds(first, first));
          instance.fitBounds(bounds, { padding: 90, maxZoom: 16, duration: 700 });
        }
      }
    });
    const centerListener = () => {
      const coordinates = latestRoute.current?.coordinates;
      if (coordinates?.length) {
        const bounds = coordinates.reduce((current, coord) => current.extend(coord), new LngLatBounds(coordinates[0]!, coordinates[0]!));
        instance.fitBounds(bounds, { padding: 90, maxZoom: 16, duration: 700 });
      }
    };
    window.addEventListener('kaali:center-map', centerListener);
<<<<<<< HEAD
    return () => { resizeObserver.disconnect(); window.removeEventListener('kaali:center-map', centerListener); markerRefs.origin?.remove(); markerRefs.destination?.remove(); markerRefs.current?.remove(); markerRefs.reports.forEach((marker) => marker.remove()); instance.remove(); map.current = null; };
=======
    return () => { resizeObserver.disconnect(); window.removeEventListener('kaali:center-map', centerListener); markerRefs.origin?.remove(); markerRefs.destination?.remove(); markerRefs.current?.remove(); instance.remove(); map.current = null; };
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
  }, []);

  useEffect(() => {
    latestRoute.current = route;
<<<<<<< HEAD
    latestAlternatives.current = alternatives;
    const instance = map.current;
    if (!instance || !instance.isStyleLoaded()) return;
    const source = instance.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    source?.setData(routeFeatures(route, alternatives));
=======
    const instance = map.current;
    if (!instance || !instance.isStyleLoaded()) return;
    const source = instance.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    source?.setData({ type: 'FeatureCollection', features: route ? [{ type: 'Feature', properties: {}, geometry: route }] : [] });
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
    if (route?.coordinates.length) {
      const first = route.coordinates[0];
      if (!first) return;
      const bounds = route.coordinates.reduce((current, coord) => current.extend(coord), new LngLatBounds(first, first));
      instance.fitBounds(bounds, { padding: 90, maxZoom: 16, duration: 700 });
    }
<<<<<<< HEAD
  }, [route, alternatives]);
=======
  }, [route]);
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const createMarker = (className: string, label: string) => {
      const element = document.createElement('div'); element.className = className; element.setAttribute('aria-label', label); element.title = label;
      return new Marker({ element, anchor: 'center' });
    };
    if (origin) markers.current.origin = (markers.current.origin || createMarker('map-marker map-marker-origin', 'Starting point')).setLngLat([origin.longitude, origin.latitude]).addTo(instance);
    else { markers.current.origin?.remove(); markers.current.origin = null; }
    if (destination) markers.current.destination = (markers.current.destination || createMarker('map-marker map-marker-destination', 'Destination')).setLngLat([destination.longitude, destination.latitude]).addTo(instance);
    else { markers.current.destination?.remove(); markers.current.destination = null; }
    if (currentPosition) markers.current.current = (markers.current.current || createMarker('map-marker map-marker-current', 'Current location')).setLngLat([currentPosition.longitude, currentPosition.latitude]).addTo(instance);
  }, [origin, destination, currentPosition]);

<<<<<<< HEAD
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    markers.current.reports.forEach((marker) => marker.remove());
    markers.current.reports = reports.map((report) => {
      const label = `Approved report · ${report.category.replaceAll('_', ' ')}`;
      const element = document.createElement('div');
      element.className = 'map-marker map-marker-report';
      element.setAttribute('aria-label', label);
      element.title = label;
      return new Marker({ element, anchor: 'center' }).setLngLat([report.location.longitude, report.location.latitude]).addTo(instance);
    });
  }, [reports]);

  return <div className="map-frame"><div ref={container} className="map-canvas" />{mapError && <div className="map-message"><span className="map-message-icon">⌖</span><strong>Map unavailable</strong><p>{mapError}</p><small>Your route request can still use the configured routing service.</small></div>}</div>;
}

function routeFeatures(selected: RouteGeometry | null, alternatives: RouteGeometry[]) {
  return { type: 'FeatureCollection' as const, features: [
    ...alternatives.map((geometry) => ({ type: 'Feature' as const, properties: { selected: false }, geometry })),
    ...(selected ? [{ type: 'Feature' as const, properties: { selected: true }, geometry: selected }] : []),
  ] };
}
=======
  return <div className="map-frame"><div ref={container} className="map-canvas" />{mapError && <div className="map-message"><span className="map-message-icon">⌖</span><strong>Map unavailable</strong><p>{mapError}</p><small>Your route request can still use the configured routing service.</small></div>}</div>;
}
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
