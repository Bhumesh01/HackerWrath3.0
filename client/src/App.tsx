import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import KaaliMap, { type RouteGeometry } from './KaaliMap';

type Coordinate = { latitude: number; longitude: number };
<<<<<<< HEAD
type Route = { routeId: string; distanceMeters: number; durationSeconds: number; riskScore: number | null; riskStatus?: 'measured' | 'estimated' | 'unknown'; riskConfidence?: number; riskScale: { min: number; max: number; higherIsRiskier: boolean }; riskLabel: string; riskExplanation?: string[]; recommended?: boolean; geometry: RouteGeometry; warnings: string[] };
type RouteResult = { routeRequestId: string; routes: Route[]; selectedRouteId: string };
type Envelope<T> = { data: T };
type Contact = { id: string; name: string; phoneE164: string; email?: string; relationship?: string; channels: string[]; priority: number; status: string };
type Report = { id: string; category: string; description: string; location: Coordinate; observedAt: string; severity: string; corroborationCount: number };
type Sos = { incidentId: string; status: string; notifications?: { status: string; contactsTargeted: number }; liveShare?: { url: string; expiresAt: string } | null };
type Screen = 'map' | 'circle' | 'reports' | 'sos';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const GUEST_SCOPE_KEY = 'kaali_guest_scope';
const guestScope = window.localStorage.getItem(GUEST_SCOPE_KEY) || Array.from(crypto.getRandomValues(new Uint8Array(12)), (value) => value.toString(16).padStart(2, '0')).join('');
window.localStorage.setItem(GUEST_SCOPE_KEY, guestScope);
axios.defaults.headers.common['X-Kaali-Guest-ID'] = guestScope;
const reportCategories = ['poor_lighting', 'isolated_area', 'blocked_road', 'harassment_report', 'flooding', 'other'] as const;
const DEVIATION_METERS = Number(import.meta.env.VITE_ROUTE_DEVIATION_THRESHOLD_METERS) || 60;
function point(value: string): Coordinate | null { const pair = value.split(',').map(Number); if (pair.length !== 2 || !pair.every(Number.isFinite)) return null; const [latitude, longitude] = pair; return latitude !== undefined && longitude !== undefined && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : null; }
function errorMessage(error: unknown, fallback: string): string { return axios.isAxiosError(error) ? (error.response?.data?.error?.message || fallback) : error instanceof Error ? error.message : fallback; }
function distance(m: number): string { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function duration(s: number): string { const n = Math.max(1, Math.round(s / 60)); return n >= 60 ? `${Math.floor(n / 60)} hr ${n % 60} min` : `${n} min`; }

export default function App() {
  const [screen, setScreen] = useState<Screen>('map');
  const [originText, setOriginText] = useState('40.7580, -73.9855');
  const [destinationText, setDestinationText] = useState('40.7536, -73.9832');
  const [priority, setPriority] = useState<'fastest' | 'balanced' | 'lower_risk'>('lower_risk');
  const [result, setResult] = useState<RouteResult | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [status, setStatus] = useState('Choose a start and destination to plan a walk.');
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [formMessage, setFormMessage] = useState('');
  const [invite, setInvite] = useState('');
  const [activeSos, setActiveSos] = useState<Sos | null>(null);
  const [sosConfirm, setSosConfirm] = useState(false);
  const [reportLat, setReportLat] = useState('');
  const [reportLon, setReportLon] = useState('');
  const [reportCategory, setReportCategory] = useState<(typeof reportCategories)[number]>('poor_lighting');
  const [reportDescription, setReportDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [sosLocation, setSosLocation] = useState<Coordinate | null>(null);
  const [sosAccuracy, setSosAccuracy] = useState(0);
  const [shareLive, setShareLive] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const session = useRef<string | null>(null);
  const watchId = useRef<number | null>(null);
  const sosWatchId = useRef<number | null>(null);
  const lastSent = useRef(0);
  const routeSnapshot = useRef<{ result: RouteResult | null; selectedId: string }>({ result: null, selectedId: '' });
  const deviationReadings = useRef(0);
  const lastReroute = useRef(0);
  const rerouting = useRef(false);
  const selected = result?.routes.find((r) => r.routeId === selectedId) ?? null;
  const origin = point(originText);
  const destination = point(destinationText);
  useEffect(() => { routeSnapshot.current = { result, selectedId }; }, [result, selectedId]);

  const findRoute = async () => {
    if (!origin || !destination) { setStatus('Use valid latitude, longitude coordinates.'); return; }
    setBusy(true); setStatus('Requesting route from KAALI…');
    try {
      const { data } = await axios.post<Envelope<RouteResult>>(`${API}/routes`, { origin, destination, mode: 'walking', priority, maxDetourRatio: 1.25 }, { timeout: 50000 });
      if (!data.data.routes?.length) throw new Error('No usable route candidates were returned.');
      setResult(data.data); setSelectedId(data.data.selectedRouteId || data.data.routes[0]!.routeId); setStatus('Route options are ready.');
      const coordinates = data.data.routes.flatMap((candidate) => candidate.geometry?.coordinates ?? []);
      if (coordinates.length) {
        const longitudes = coordinates.map(([longitude]) => longitude); const latitudes = coordinates.map(([, latitude]) => latitude);
        const buffer = 0.01;
        const bbox = `${Math.min(...longitudes) - buffer},${Math.min(...latitudes) - buffer},${Math.max(...longitudes) + buffer},${Math.max(...latitudes) + buffer}`;
        void axios.get<Envelope<Report[]>>(`${API}/reports`, { params: { bbox } }).then(({ data: reportsData }) => setReports(reportsData.data)).catch(() => setReports([]));
      }
    } catch (e) { setStatus(errorMessage(e, 'Could not calculate a route. Check the API and routing provider.')); }
    finally { setBusy(false); }
  };

  const requestGps = (done: (position: GeolocationPosition) => void) => {
    if (!navigator.geolocation) { setFormMessage('Location is not available in this browser.'); return; }
    setFormMessage('Waiting for your location permission…');
    navigator.geolocation.getCurrentPosition((p) => { setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude }); done(p); }, (e) => setFormMessage(e.code === e.PERMISSION_DENIED ? 'Location permission was denied. You can enter coordinates manually.' : 'Could not read your location. Check device location settings.'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  };

  const stopWatch = useCallback(() => { if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); watchId.current = null; session.current = null; }, []);
  useEffect(() => () => stopWatch(), [stopWatch]);
  useEffect(() => {
    if (!activeSos || activeSos.status !== 'active' || !shareLive || !navigator.geolocation) return;
    let lastUpdateAt = 0;
    sosWatchId.current = navigator.geolocation.watchPosition((p) => {
      const now = Date.now();
      if (now - lastUpdateAt < 10000) return;
      lastUpdateAt = now;
      const location = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setSosLocation(location);
      setSosAccuracy(p.coords.accuracy);
      void axios.post(`${API}/sos/${activeSos.incidentId}/location`, { location: { ...location, accuracyMeters: p.coords.accuracy, capturedAt: new Date(p.timestamp).toISOString() } }).catch(() => setFormMessage('Live location update failed. The last accepted location may be out of date.'));
    }, () => setFormMessage('Live location unavailable. The incident remains active.'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => { if (sosWatchId.current !== null) navigator.geolocation.clearWatch(sosWatchId.current); sosWatchId.current = null; };
  }, [activeSos, shareLive]);
  const finishNavigation = async () => {
    if (!session.current) return;
    const id = session.current; stopWatch(); setNavigationActive(false);
    try { await axios.post(`${API}/navigation/sessions/${id}/finish`, { reason: 'stopped' }); setStatus('Navigation ended.'); }
    catch (e) { setStatus(errorMessage(e, 'Tracking stopped on this device; the server could not be updated.')); }
  };
  const beginNavigation = () => {
    if (!result || !selected || !navigator.geolocation) { setStatus('Choose a route and allow location access to start navigation.'); return; }
    requestGps((first) => { void axios.post<Envelope<{ navigationSessionId: string; locationUpdateIntervalHintSeconds: number }>>(`${API}/navigation/sessions`, { routeRequestId: result.routeRequestId, selectedRouteId: selected.routeId, shareLocationWithContacts: false }).then(({ data }) => {
      const active = data.data; session.current = active.navigationSessionId; setNavigationActive(true); setStatus('Navigation is active. Location updates are sent only while it is running.'); lastSent.current = 0;
      const send = (p: GeolocationPosition) => { if (session.current !== active.navigationSessionId) return; const pos = { latitude: p.coords.latitude, longitude: p.coords.longitude }; setPosition(pos); const now = Date.now(); if (now - lastSent.current > Math.max(10, active.locationUpdateIntervalHintSeconds) * 1000) { lastSent.current = now; void axios.post(`${API}/navigation/sessions/${active.navigationSessionId}/location`, { location: { ...pos, accuracyMeters: p.coords.accuracy, capturedAt: new Date(p.timestamp).toISOString() } }).catch(() => setStatus('GPS is active, but the server did not accept a location update.')); }
        const snapshot = routeSnapshot.current; const activeRoute = snapshot.result?.routes.find((candidate) => candidate.routeId === snapshot.selectedId);
        if (!activeRoute || p.coords.accuracy > 100) return;
        const offRoute = distanceToRouteMeters(pos, activeRoute.geometry) > Math.max(DEVIATION_METERS, p.coords.accuracy * 1.5);
        deviationReadings.current = offRoute ? deviationReadings.current + 1 : 0;
        if (deviationReadings.current >= 2 && now - lastReroute.current > 30000 && !rerouting.current) { rerouting.current = true; lastReroute.current = now; deviationReadings.current = 0; setStatus('Off route. Requesting a reroute…'); void axios.post<Envelope<RouteResult>>(`${API}/navigation/sessions/${active.navigationSessionId}/reroute`, { currentLocation: { ...pos, accuracyMeters: p.coords.accuracy }, reason: 'route_deviation' }, { timeout: 50000 }).then(({ data: response }) => { if (session.current !== active.navigationSessionId) return; setResult(response.data); setSelectedId(response.data.selectedRouteId); setStatus('Route updated from your current location.'); }).catch((error: unknown) => { setStatus(errorMessage(error, 'Reroute failed. Keeping the last route.')); }).finally(() => { rerouting.current = false; }); }
      };
      send(first); watchId.current = navigator.geolocation.watchPosition(send, (e) => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); watchId.current = null; setStatus(e.code === e.PERMISSION_DENIED ? 'Location permission was revoked. Finish the active session to stop server tracking.' : 'GPS update unavailable. Finish the active session to stop server tracking.'); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    }).catch((e) => setFormMessage(errorMessage(e, 'Could not start navigation.'))); });
  };

  const loadContacts = useCallback(async () => { try { const { data } = await axios.get<Envelope<Contact[]>>(`${API}/contacts`); setContacts(data.data); setFormMessage(''); } catch (e) { setFormMessage(errorMessage(e, 'Could not load trusted contacts.')); } }, []);
  const addContact = async (event: React.FormEvent) => { event.preventDefault(); setFormMessage('Saving invitation…'); try { const { data } = await axios.post<Envelope<{ invitationToken?: string; id: string; status: string }>>(`${API}/contacts`, { name: contactName, phoneE164: contactPhone, relationship: contactRelation || undefined, channels: ['sms'], priority: 1 }); setInvite(data.data.invitationToken || ''); setFormMessage(`Invitation created with status: ${data.data.status}. The contact is not accepted yet.`); setContactName(''); setContactPhone(''); setContactRelation(''); await loadContacts(); } catch (e) { setFormMessage(errorMessage(e, 'Could not add contact.')); } };
  const deleteContact = async (id: string) => { try { await axios.delete(`${API}/contacts/${id}`); await loadContacts(); } catch (e) { setFormMessage(errorMessage(e, 'Could not remove contact.')); } };
  const updateContactChannel = async (id: string, channel: string) => { try { await axios.patch(`${API}/contacts/${id}`, { channels: [channel] }); await loadContacts(); setFormMessage('Notification preference updated.'); } catch (e) { setFormMessage(errorMessage(e, 'Could not update notification preference.')); } };
  const loadReports = useCallback(async () => { const mapCenter = point(originText); const minLat = Number(reportLat || mapCenter?.latitude || 40.49); const minLon = Number(reportLon || mapCenter?.longitude || -74.26); const bbox = `${minLon - 0.03},${minLat - 0.03},${minLon + 0.03},${minLat + 0.03}`; try { const { data } = await axios.get<Envelope<Report[]>>(`${API}/reports`, { params: { bbox } }); setReports(data.data); setFormMessage(''); } catch (e) { setFormMessage(errorMessage(e, 'Could not load approved reports.')); } }, [originText, reportLat, reportLon]);
  const submitReport = async (event: React.FormEvent) => { event.preventDefault(); const lat = Number(reportLat); const lon = Number(reportLon); if (!Number.isFinite(lat) || !Number.isFinite(lon)) { setFormMessage('Enter a valid latitude and longitude.'); return; } try { const { data } = await axios.post<Envelope<{ reportId: string; status: string; submittedAt: string }>>(`${API}/reports`, { category: reportCategory, description: reportDescription, location: { latitude: lat, longitude: lon }, observedAt: new Date().toISOString() }); setFormMessage(`Report submitted. Moderation status: ${data.data.status}.`); setReportDescription(''); } catch (e) { setFormMessage(errorMessage(e, 'Could not submit report.')); } };
  const confirmReport = async (id: string) => { try { await axios.post(`${API}/reports/${id}/confirm`); await loadReports(); setFormMessage('Confirmation recorded.'); } catch (e) { setFormMessage(errorMessage(e, 'Could not confirm this report.')); } };
  const createSos = async () => { setSosConfirm(false); setFormMessage('Creating SOS incident…'); const loc = sosLocation; if (!loc) { setFormMessage('Capture a location first, then activate SOS. No incident was created.'); return; } try { const { data } = await axios.post<Envelope<Sos>>(`${API}/sos`, { trigger: 'manual', location: { ...loc, accuracyMeters: sosAccuracy, capturedAt: new Date().toISOString() }, shareLocation: shareLive }, { headers: { 'Idempotency-Key': crypto.randomUUID() } }); setActiveSos(data.data); setFormMessage(`Incident ${data.data.status}. Notification status: ${data.data.notifications?.status ?? 'unknown'}; contacts targeted: ${data.data.notifications?.contactsTargeted ?? 0}.`); } catch (e) { setFormMessage(errorMessage(e, 'SOS could not be created.')); } };
  const captureSosLocation = () => requestGps((p) => { const loc = { latitude: p.coords.latitude, longitude: p.coords.longitude }; setSosLocation(loc); setSosAccuracy(p.coords.accuracy); setFormMessage(`Location ready to share: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} (±${Math.round(p.coords.accuracy)} m).`); });
  const resolveSos = async (resolution: 'resolved' | 'cancelled' | 'false_alarm') => { if (!activeSos) return; try { await axios.post(`${API}/sos/${activeSos.incidentId}/resolve`, { resolution }); setActiveSos({ ...activeSos, status: resolution }); setFormMessage(`Incident ${resolution}.`); } catch (e) { setFormMessage(errorMessage(e, 'Could not update this incident.')); } };
  const retrySos = async () => { if (!activeSos) return; try { const { data } = await axios.post<Envelope<Sos['notifications']>>(`${API}/sos/${activeSos.incidentId}/notify-again`); setFormMessage(`Notification request status: ${data.data?.status ?? 'unknown'}.`); } catch (e) { setFormMessage(errorMessage(e, 'Could not retry notification.')); } };

  const nav = (s: Screen, title: string) => <button className={`nav-item ${screen === s ? 'active' : ''}`} onClick={() => { setScreen(s); setFormMessage(''); if (s === 'circle') void loadContacts(); if (s === 'reports') void loadReports(); }}><span className="nav-glyph" aria-hidden="true">{s === 'map' ? '⌖' : s === 'circle' ? '♧' : s === 'reports' ? '◉' : '＋'}</span>{title}</button>;

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-mark">K</span><span>kaali<span className="brand-period">.</span></span></a>
      <div className="sidebar-note"><span className="live-dot"/>Anonymous mode · saved in this browser</div>
      <div className="nav-label">YOUR SPACE</div><nav className="primary-nav" aria-label="Main navigation">{nav('map', 'Safety map')}{nav('circle', 'Trusted circle')}{nav('reports', 'Community reports')}{nav('sos', 'Emergency SOS')}</nav>
      <div className="sidebar-spacer"/><div className="support-card"><strong>Your safety, your pace.</strong><p>Location is requested only when you choose a location feature.</p></div>
      <button className="sos-sidebar" onClick={() => { setScreen('sos'); setFormMessage(''); }}><span className="sos-symbol">SOS</span><span><b>Need help now?</b><small>Open emergency options</small></span><span className="sos-arrow">↗</span></button>
      <div className="sidebar-footer"><span className="avatar">K</span><span><b>KAALI</b><small>Anonymous browser space</small></span></div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="breadcrumb"><span>My space</span><span className="crumb-divider">/</span><strong>{screen === 'map' ? 'Safety map' : screen === 'circle' ? 'Trusted circle' : screen === 'reports' ? 'Community reports' : 'Emergency SOS'}</strong></div><div className="topbar-right"><span className="connection"><span className="connection-dot"/>Anonymous browser</span></div></header>
      {screen === 'map' && <div className="page-wrap safety-page"><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/>A SMALLER STEP, A THOUGHTFUL JOURNEY</div><h1>Find a route with<br/><em>more context.</em></h1><p className="welcome-copy">Compare route options using information KAALI can actually assess.</p></div><div className="date-card"><span className="date-sun">✳</span><span><b>Take your time.</b><small>One moment at a time</small></span></div></div>
        <div className="notice-strip"><span className="notice-icon">◇</span><div><b>You are in control.</b><span>Location is only used for a route, navigation, report, or SOS you request.</span></div></div>
        <div className="safety-grid"><section className="journey-card"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>ON YOUR WAY</div><h2>Plan a walking route</h2></div><span className="update-label"><span className="live-dot"/>KAALI routing</span></div>
          <label className="field-label" htmlFor="origin">Starting point <small>LATITUDE, LONGITUDE</small></label><div className="coordinate-field"><span className="pin origin-pin">●</span><input id="origin" value={originText} onChange={(e) => setOriginText(e.target.value)} placeholder="Latitude, longitude"/><button className="quiet-button" aria-label="Use current location for start" onClick={() => requestGps((p) => setOriginText(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`))}>◎</button></div>
          <div className="connector"/><label className="field-label" htmlFor="destination">Destination <small>LATITUDE, LONGITUDE</small></label><div className="coordinate-field"><span className="pin destination-pin">◆</span><input id="destination" value={destinationText} onChange={(e) => setDestinationText(e.target.value)} placeholder="Latitude, longitude"/><button className="quiet-button" aria-label="Swap origin and destination" onClick={() => { setOriginText(destinationText); setDestinationText(originText); }}>⇅</button></div>
          <label className="field-label preference-label" htmlFor="priority">Route preference</label><select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}><option value="lower_risk">Lower estimated risk</option><option value="balanced">Balanced</option><option value="fastest">Fastest</option></select>
          <button className="primary-button" onClick={() => void findRoute()} disabled={busy}>{busy ? <><span className="spinner"/>Finding route</> : <>Find route <span>↗</span></>}</button><div className="status-line" role="status"><span className="status-indicator"/>{status}</div>
          {selected && <section className="route-result"><div className="result-heading"><div><span className="eyebrow">KAALI ROUTE OPTIONS</span><h2>Compare your walk</h2></div><span className="route-badge">{selected.riskLabel.replaceAll('_',' ')}</span></div><div className="metrics"><div><strong>{distance(selected.distanceMeters)}</strong><small>DISTANCE</small></div><div><strong>{duration(selected.durationSeconds)}</strong><small>EST. WALK</small></div></div><div className={`risk-card ${selected.riskScore === null || selected.riskStatus === 'unknown' ? 'risk-unknown' : ''}`}><div className="risk-top"><span>{selected.riskStatus === 'measured' ? 'Measured risk indicator' : selected.riskScore === null || selected.riskStatus === 'unknown' ? 'Risk information' : 'Estimated risk indicator'}</span><strong>{selected.riskScore === null || selected.riskStatus === 'unknown' ? 'Unknown' : <>{selected.riskScore}<small> / {selected.riskScale.max}</small></>}</strong></div>{selected.riskScore !== null && selected.riskStatus !== 'unknown' && <div className="risk-track"><span style={{ width: `${Math.max(0, Math.min(100, selected.riskScore))}%` }}/></div>}<p>{selected.riskScore === null || selected.riskStatus === 'unknown' ? 'There is not enough route-matched information to assess this route. Unknown does not mean safe.' : `Confidence ${selected.riskConfidence === undefined ? 'not supplied' : `${Math.round(selected.riskConfidence * 100)}%`}. A report-derived score is an indicator based on available information, not a probability of harm or guarantee.`}</p></div><ul className="risk-explanations">{selected.riskExplanation?.map((item) => <li key={item}>{item}</li>)}</ul>{selected.warnings?.map((w) => <p className="route-warning" key={w}>{w}</p>)}<div className="route-choice">{result?.routes.map((r,i)=><button key={r.routeId} className={`choice ${r.routeId===selectedId?'active':''}`} onClick={()=>setSelectedId(r.routeId)}><span>{r.recommended?'Recommended':`Option ${i+1}`}</span><strong>{duration(r.durationSeconds)}</strong>{r.riskScore===null&&<small>Risk unknown</small>}</button>)}</div>{navigationActive ? <button className="secondary-button" onClick={()=>void finishNavigation()}>Finish navigation</button> : <button className="secondary-button" onClick={beginNavigation}>Start navigation <span>→</span></button>}</section>}
          <footer className="panel-foot"><span className="shield">◇</span><p>Route estimates cannot guarantee personal safety. Pilot-area limits apply.</p></footer></section>
          <section className="map-area" aria-label="Safety route map"><KaaliMap origin={origin} destination={destination} route={selected?.geometry || null} alternatives={result?.routes.filter((candidate) => candidate.routeId !== selectedId).flatMap((candidate) => candidate.geometry ? [candidate.geometry] : [])} reports={reports} currentPosition={position}/><div className="map-caption"><span className="map-caption-dot"/>{selected ? `${result?.routes.length ?? 1} route option${result?.routes.length === 1 ? '' : 's'}` : 'Plan a route to see geometry'}<span className="caption-divider"/>MapLibre</div><button className="map-control" aria-label="Center route" onClick={()=>window.dispatchEvent(new Event('kaali:center-map'))}>◎</button></section></div></div>}
      {screen === 'circle' && <div className="page-wrap content-page"><div className="eyebrow"><span className="eyebrow-line"/>PEOPLE YOU CHOOSE</div><h1>Your trusted<br/><em>circle.</em></h1><p className="welcome-copy">Add people who may receive notifications when you ask KAALI for help. New invitations stay pending until accepted.</p><section className="surface-card"><h2>Add a trusted contact</h2><form className="form-grid" onSubmit={(e)=>void addContact(e)}><label>Name<input required maxLength={100} value={contactName} onChange={(e)=>setContactName(e.target.value)} placeholder="Contact name"/></label><label>Phone number<input required minLength={8} maxLength={20} value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="+1 555 010 1234"/></label><label>Relationship <span className="muted">optional</span><input maxLength={50} value={contactRelation} onChange={(e)=>setContactRelation(e.target.value)} placeholder="Friend, family…"/></label><button className="primary-button" type="submit">Create invitation</button></form>{invite&&<div className="invite-box"><b>Invitation token · shown once</b><code>{invite}</code><button className="secondary-button" onClick={()=>void navigator.clipboard.writeText(invite)}>Copy token</button></div>}</section><section className="surface-card"><div className="section-heading"><h2>Trusted contacts</h2><button className="text-button" onClick={()=>void loadContacts()}>Refresh</button></div>{contacts.length===0?<p className="empty-note">No contacts to show. Add a contact above to create an invitation.</p>:<div className="list-stack">{contacts.map((c)=><article className="list-row" key={c.id}><span className="avatar">{c.name.slice(0,1).toUpperCase()}</span><div className="list-main"><b>{c.name}</b><span>{c.phoneE164}{c.relationship?` · ${c.relationship}`:''}</span><small>{c.channels.join(', ')} notification preference</small><select className="contact-channel" aria-label={`Notification preference for ${c.name}`} value={c.channels[0] || 'sms'} onChange={(e)=>void updateContactChannel(c.id,e.target.value)}><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></div><span className={`status-badge ${c.status}`}>{c.status}</span><button className="danger-link" onClick={()=>void deleteContact(c.id)}>Remove</button></article>)}</div>}</section>{formMessage&&<p className="message-strip" role="status">{formMessage}</p>}</div>}
      {screen === 'reports' && <div className="page-wrap content-page"><div className="eyebrow"><span className="eyebrow-line"/>COMMUNITY INFORMATION</div><h1>Share what you<br/><em>notice.</em></h1><p className="welcome-copy">Reports are community observations. Submitted reports are pending moderation; only approved reports are shown publicly.</p><section className="surface-card"><h2>Submit a safety report</h2><form className="form-grid" onSubmit={(e)=>void submitReport(e)}><label>Category<select value={reportCategory} onChange={(e)=>setReportCategory(e.target.value as typeof reportCategory)}>{reportCategories.map((c)=><option key={c} value={c}>{c.replaceAll('_',' ')}</option>)}</select></label><label>Description<textarea required minLength={3} maxLength={500} value={reportDescription} onChange={(e)=>setReportDescription(e.target.value)} placeholder="Describe what you observed (3–500 characters)"/></label><div className="form-row"><label>Latitude<input required type="number" step="any" value={reportLat} onChange={(e)=>setReportLat(e.target.value)} placeholder="40.75"/></label><label>Longitude<input required type="number" step="any" value={reportLon} onChange={(e)=>setReportLon(e.target.value)} placeholder="-73.98"/></label><button className="quiet-button location-button" type="button" onClick={()=>requestGps((p)=>{setReportLat(String(p.coords.latitude));setReportLon(String(p.coords.longitude));})}>Use current location</button></div><button className="primary-button" type="submit">Submit report</button></form></section><section className="surface-card"><div className="section-heading"><div><h2>Approved reports nearby</h2><small className="muted">The API returns approved reports within the selected search area.</small></div><button className="text-button" onClick={()=>void loadReports()}>Refresh</button></div>{reports.length===0?<p className="empty-note">No approved reports were returned for this area. This does not mean the area is safe.</p>:<div className="list-stack">{reports.map((r)=><article className="list-row" key={r.id}><span className="report-mark">◉</span><div className="list-main"><b>{r.category.replaceAll('_',' ')}</b><span>{r.description}</span><small>{new Date(r.observedAt).toLocaleString()} · {r.corroborationCount} confirmations · {r.severity} severity</small></div><button className="text-button" onClick={()=>void confirmReport(r.id)}>Confirm</button></article>)}</div>}</section>{formMessage&&<p className="message-strip" role="status">{formMessage}</p>}</div>}
      {screen === 'sos' && <div className="page-wrap content-page sos-page"><div className="eyebrow"><span className="eyebrow-line"/>HELP ON YOUR TERMS</div><h1>Emergency<br/><em>support.</em></h1><p className="welcome-copy">KAALI can create an incident and request notifications through configured services. It does not dispatch police or emergency services.</p><section className="sos-card"><div className="sos-ring">SOS</div><div><h2>Request help from your trusted circle</h2><p>Capture and review the location that will be shared before creating an incident. No sign-in is needed. The incident is scoped to this anonymous browser identifier.</p></div><div className="sos-location"><b>Location to share</b><span>{sosLocation ? `${sosLocation.latitude.toFixed(5)}, ${sosLocation.longitude.toFixed(5)}` : 'Not captured'}</span><button className="secondary-button" onClick={captureSosLocation}>Capture current location</button></div>{activeSos?.liveShare&&<div className="share-box"><b>Live location link · expires {new Date(activeSos.liveShare.expiresAt).toLocaleString()}</b><a href={activeSos.liveShare.url} target="_blank" rel="noreferrer">Open sharing page</a></div>}<div className="sos-actions">{!sosConfirm?<button className="sos-confirm-button" onClick={()=>setSosConfirm(true)} disabled={!sosLocation}>Continue to SOS</button>:<div className="confirm-box"><b>Create an emergency incident and request sharing of the location shown above?</b><label className="share-toggle"><input type="checkbox" checked={shareLive} onChange={(e)=>setShareLive(e.target.checked)}/> Keep sharing live location while the incident is active</label><button className="sos-confirm-button" onClick={()=>void createSos()}>Create SOS now</button><button className="quiet-button" onClick={()=>setSosConfirm(false)}>Go back</button></div>}</div>{activeSos&&<div className="incident-card"><b>Incident status: {activeSos.status}</b><span>Notification request: {activeSos.notifications?.status??'not supplied'} · contacts targeted: {activeSos.notifications?.contactsTargeted??0}</span>{activeSos.status==='active'&&<div className="button-row"><button className="secondary-button" onClick={()=>void retrySos()}>Retry notification request</button><button className="secondary-button" onClick={()=>void resolveSos('resolved')}>Resolve incident</button><button className="danger-button" onClick={()=>void resolveSos('cancelled')}>Cancel incident</button></div>}</div>}</section>{formMessage&&<p className="message-strip" role="status">{formMessage}</p>}</div>}
    </section>
  </main>;
}

=======
type Route = {
  routeId: string;
  distanceMeters: number;
  durationSeconds: number;
  riskScore: number | null;
  riskStatus?: 'measured' | 'estimated' | 'unknown';
  riskConfidence?: number;
  riskScale: { min: number; max: number; higherIsRiskier: boolean };
  riskLabel: string;
  geometry: RouteGeometry;
  warnings: string[];
};
type RouteResult = { routeRequestId: string; routes: Route[]; selectedRouteId: string };
type ApiEnvelope<T> = { data: T };
type NavSession = { navigationSessionId: string; locationUpdateIntervalHintSeconds: number };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const DEVIATION_THRESHOLD_METERS = Number(import.meta.env.VITE_ROUTE_DEVIATION_THRESHOLD_METERS) || 60;

function parseCoordinatePair(value: string): Coordinate | null {
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  const [latitude, longitude] = parts;
  if (latitude === undefined || longitude === undefined || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function App() {
  const [originText, setOriginText] = useState('40.7580, -73.9855');
  const [destinationText, setDestinationText] = useState('40.7536, -73.9832');
  const [token, setToken] = useState(() => window.localStorage.getItem('kaali_access_token') || '');
  const [priority, setPriority] = useState<'fastest' | 'balanced' | 'lower_risk'>('lower_risk');
  const [result, setResult] = useState<RouteResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [session, setSession] = useState<NavSession | null>(null);
  const [authDestination, setAuthDestination] = useState('');
  const [authChannel, setAuthChannel] = useState<'phone' | 'email'>('phone');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [currentPosition, setCurrentPosition] = useState<Coordinate | null>(null);
  const [status, setStatus] = useState('Enter coordinates and find a route');
  const [busy, setBusy] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastLocationSentAt = useRef(0);
  const lastRerouteAt = useRef(0);
  const deviationCount = useRef(0);
  const rerouting = useRef(false);
  const starting = useRef(false);
  const activeSessionId = useRef<string | null>(null);
  const latestResult = useRef<RouteResult | null>(null);
  const latestSelectedRouteId = useRef('');
  const selectedRoute = result?.routes.find((route) => route.routeId === selectedRouteId) || null;
  const origin = parseCoordinatePair(originText);
  const destination = parseCoordinatePair(destinationText);
  useEffect(() => { latestResult.current = result; }, [result]);
  useEffect(() => { latestSelectedRouteId.current = selectedRouteId; }, [selectedRouteId]);

  const requestRoute = useCallback(async (from: Coordinate, to: Coordinate, reason?: string) => {
    const response = await axios.post<ApiEnvelope<RouteResult>>(`${API_URL}/routes`, {
      origin: from,
      destination: to,
      mode: 'walking',
      priority,
      maxDetourRatio: 1.25,
    }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
    const routeData = response.data.data;
    if (!routeData.routes.length) throw new Error('The routing service returned no usable route.');
    setResult(routeData);
    const nextSelected = routeData.selectedRouteId || routeData.routes[0]!.routeId;
    setSelectedRouteId(nextSelected);
    if (reason) setStatus('Route updated');
  }, [priority, token]);

  const findRoute = async () => {
    if (!origin || !destination) { setStatus('Enter valid latitude, longitude coordinates'); return; }
    if (!token.trim()) { setStatus('Add your Kaali access token to request a protected route'); return; }
    window.localStorage.setItem('kaali_access_token', token.trim());
    setBusy(true);
    setStatus('Calculating route');
    try {
      await requestRoute(origin, destination);
      setStatus('Route ready');
    } catch (error) {
      setStatus(axios.isAxiosError(error) ? (error.response?.data?.error?.message || 'Routing service unavailable. Check the API and routing provider configuration.') : (error instanceof Error ? error.message : 'Route request failed'));
    } finally { setBusy(false); }
  };

  const requestOtp = async () => {
    try {
      const response = await axios.post<ApiEnvelope<{ challengeId: string }>>(`${API_URL}/auth/otp`, { channel: authChannel, destination: authDestination });
      setChallengeId(response.data.data.challengeId);
      setAuthMessage('Code sent. In development, check the Express server log.');
    } catch (error) { setAuthMessage(axios.isAxiosError(error) ? (error.response?.data?.error?.message || 'Could not request a sign-in code') : 'Could not request a sign-in code'); }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post<ApiEnvelope<{ accessToken: string }>>(`${API_URL}/auth/verify`, { challengeId, code: otpCode });
      setToken(response.data.data.accessToken);
      window.localStorage.setItem('kaali_access_token', response.data.data.accessToken);
      setAuthMessage('Signed in. Your token is saved on this device.');
    } catch (error) { setAuthMessage(axios.isAxiosError(error) ? (error.response?.data?.error?.message || 'Code could not be verified') : 'Code could not be verified'); }
  };

  const finishNavigation = useCallback(async () => {
    if (!session) return;
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    activeSessionId.current = null;
    try {
      await axios.post(`${API_URL}/navigation/sessions/${session.navigationSessionId}/finish`, { reason: 'stopped' }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* Session may already have expired; local tracking still stops. */ }
    setSession(null);
    setCurrentPosition(null);
    setStatus('Navigation ended');
  }, [session, token]);

  const beginNavigation = async () => {
    if (starting.current || watchId.current !== null || !result || !selectedRoute) return;
    starting.current = true;
    setStatus('Starting navigation');
    try {
      const response = await axios.post<ApiEnvelope<NavSession>>(`${API_URL}/navigation/sessions`, {
        routeRequestId: result.routeRequestId,
        selectedRouteId,
        shareLocationWithContacts: false,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const activeSession = response.data.data;
      activeSessionId.current = activeSession.navigationSessionId;
      setSession(activeSession);
      if (!navigator.geolocation) { setStatus('GPS unavailable'); activeSessionId.current = null; return; }
      setStatus('Requesting GPS permission');
      watchId.current = navigator.geolocation.watchPosition(async (position) => {
        if (activeSessionId.current !== activeSession.navigationSessionId) return;
        if (Date.now() - position.timestamp > 30000) { setStatus('GPS unavailable · location reading is stale'); return; }
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCurrentPosition(point);
        setStatus('Navigation active');
        const now = Date.now();
        if (now - lastLocationSentAt.current >= Math.max(5, activeSession.locationUpdateIntervalHintSeconds) * 1000) {
          lastLocationSentAt.current = now;
          try {
            await axios.post(`${API_URL}/navigation/sessions/${activeSession.navigationSessionId}/location`, { location: { ...point, accuracyMeters: position.coords.accuracy, capturedAt: new Date(position.timestamp).toISOString() } }, { headers: { Authorization: `Bearer ${token}` } });
          } catch { if (activeSessionId.current === activeSession.navigationSessionId) setStatus('GPS active; server location update failed'); }
        }
        if (activeSessionId.current !== activeSession.navigationSessionId) return;
        const route = latestResult.current?.routes.find((candidate) => candidate.routeId === latestSelectedRouteId.current);
        if (!route || position.coords.accuracy > 100) return;
        const distance = distanceToRouteMeters(point, route.geometry);
        deviationCount.current = distance > Math.max(DEVIATION_THRESHOLD_METERS, position.coords.accuracy * 1.5) ? deviationCount.current + 1 : 0;
        if (deviationCount.current >= 2 && now - lastRerouteAt.current > 30000 && !rerouting.current) {
          rerouting.current = true;
          lastRerouteAt.current = now;
          deviationCount.current = 0;
          setStatus('Off route · Recalculating route');
          try {
            const reroute = await axios.post<ApiEnvelope<RouteResult>>(`${API_URL}/navigation/sessions/${activeSession.navigationSessionId}/reroute`, {
              currentLocation: { ...point, accuracyMeters: position.coords.accuracy },
              reason: 'route_deviation',
            }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
            if (activeSessionId.current !== activeSession.navigationSessionId) return;
            const updated = reroute.data.data;
            setResult({ routeRequestId: updated.routeRequestId, routes: updated.routes, selectedRouteId: updated.selectedRouteId });
            setSelectedRouteId(updated.selectedRouteId);
            setStatus('Route rerouted');
          } catch { setStatus('Off route · Reroute failed; keeping last valid route'); }
          finally { rerouting.current = false; }
        }
      }, (error) => {
        activeSessionId.current = null;
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setStatus(error.code === error.PERMISSION_DENIED ? 'GPS unavailable · location permission denied' : 'GPS unavailable · check device location');
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    } catch (error) {
      activeSessionId.current = null;
      setStatus(axios.isAxiosError(error) ? (error.response?.data?.error?.message || 'Could not start navigation') : 'Could not start navigation');
    } finally { starting.current = false; }
  };

  useEffect(() => () => { activeSessionId.current = null; if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Kaali home"><span className="brand-mark">K</span><span>kaali</span></a>
        <div className="top-status"><span className={`status-dot ${session ? 'live' : ''}`} />{session ? 'Navigation active' : 'Personal safety navigation'}</div>
        <span className="pilot-pill">NEW YORK CITY PILOT</span>
      </header>
      <section className="workspace">
        <aside className="route-panel">
          <div className="eyebrow">YOUR JOURNEY</div>
          <h1>Move with more<br /><span>confidence.</span></h1>
          <p className="intro">Plan a walking route and see the information behind its estimated risk.</p>
          <label className="field-label" htmlFor="origin">Starting point <small>LATITUDE, LONGITUDE</small></label>
          <div className="coordinate-field"><span className="pin origin-pin">●</span><input id="origin" value={originText} onChange={(event) => setOriginText(event.target.value)} placeholder="40.7580, -73.9855" /></div>
          <div className="connector" />
          <label className="field-label" htmlFor="destination">Destination <small>LATITUDE, LONGITUDE</small></label>
          <div className="coordinate-field"><span className="pin destination-pin">◆</span><input id="destination" value={destinationText} onChange={(event) => setDestinationText(event.target.value)} placeholder="40.7536, -73.9832" /></div>
          <label className="field-label preference-label" htmlFor="priority">Route preference</label>
          <select id="priority" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="lower_risk">Lower estimated risk</option><option value="balanced">Balanced</option><option value="fastest">Fastest</option></select>
          <details className="token-details"><summary>{token ? 'Signed in · manage access' : 'Sign in to Kaali'}</summary><div className="auth-fields"><div className="auth-row"><select aria-label="Sign-in channel" value={authChannel} onChange={(event) => setAuthChannel(event.target.value as typeof authChannel)}><option value="phone">Phone</option><option value="email">Email</option></select><input aria-label="Phone number or email" value={authDestination} onChange={(event) => setAuthDestination(event.target.value)} placeholder={authChannel === 'phone' ? '+91 phone number' : 'you@example.com'} /></div>{challengeId && <div className="auth-row"><input aria-label="Six-digit sign-in code" inputMode="numeric" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="6-digit code" /><button className="text-button" onClick={() => void verifyOtp()}>Verify</button></div>}<button className="text-button request-code" onClick={() => void requestOtp()}>{challengeId ? 'Send another code' : 'Send sign-in code'}</button>{authMessage && <p className="auth-message" role="status">{authMessage}</p>}</div><div className="token-divider">or use an existing access token</div><input aria-label="Kaali access token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste your access token" autoComplete="off" /></details>
          <button className="primary-button" onClick={() => void findRoute()} disabled={busy}>{busy ? <><span className="spinner" /> Calculating</> : <>Find a route <span aria-hidden="true">↗</span></>}</button>
          <div className="status-line" role="status"><span className="status-indicator" />{status}</div>
          {selectedRoute && <section className="route-result" aria-live="polite">
            <div className="result-heading"><div><span className="eyebrow">RECOMMENDED ROUTE</span><h2>Your route</h2></div><span className="route-badge">{selectedRoute.riskLabel.replaceAll('_', ' ')}</span></div>
            <div className="metrics"><div><strong>{formatDistance(selectedRoute.distanceMeters)}</strong><small>DISTANCE</small></div><div><strong>{formatDuration(selectedRoute.durationSeconds)}</strong><small>EST. WALK</small></div></div>
            <div className="risk-card"><div className="risk-top"><span>{selectedRoute.riskStatus === 'unknown' || selectedRoute.riskScore === null ? 'Risk data' : 'Estimated risk'}</span><strong>{selectedRoute.riskScore === null ? 'Unknown' : <>{selectedRoute.riskScore}<small> / {selectedRoute.riskScale.max}</small></>}</strong></div>{selectedRoute.riskScore !== null && <div className="risk-track"><span style={{ width: `${Math.max(0, Math.min(100, selectedRoute.riskScore))}%` }} /></div>}<p>{selectedRoute.riskScore === null ? 'No verified, route-matched hazard reports are available. Unknown does not mean safe.' : `Confidence: ${Math.round((selectedRoute.riskConfidence ?? 0) * 100)}%. Reports are community data, not a guarantee of safety.`}</p></div>
            {selectedRoute.warnings.map((warning) => <p className="route-warning" key={warning}>{warning}</p>)}
            <div className="route-choice">{result?.routes.map((route, index) => <button key={route.routeId} className={route.routeId === selectedRouteId ? 'choice active' : 'choice'} onClick={() => setSelectedRouteId(route.routeId)}><span>Option {index + 1}</span><strong>{formatDuration(route.durationSeconds)}</strong></button>)}</div>
            {session ? <button className="secondary-button" onClick={() => void finishNavigation()}>End navigation</button> : <button className="secondary-button" onClick={() => void beginNavigation()}>Start navigation <span>→</span></button>}
          </section>}
          <footer className="panel-foot"><span className="shield">◇</span><p>Risk estimates are informational and cannot guarantee personal safety.</p></footer>
        </aside>
        <section className="map-area" aria-label="Route map"><KaaliMap origin={origin} destination={destination} route={selectedRoute?.geometry || null} currentPosition={currentPosition} /><div className="map-caption"><span className="map-caption-dot" />{selectedRoute ? `${result?.routes.length ?? 1} route option${result?.routes.length === 1 ? '' : 's'}` : 'Map preview'}<span className="caption-divider" />OpenStreetMap data</div><button className="map-control" aria-label="Center map" onClick={() => window.dispatchEvent(new Event('kaali:center-map'))}>◎</button></section>
      </section>
    </main>
  );
}

function formatDistance(meters: number): string { return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`; }
function formatDuration(seconds: number): string { const minutes = Math.max(1, Math.round(seconds / 60)); return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`; }
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
function distanceToRouteMeters(point: Coordinate, geometry: RouteGeometry): number {
  const toXY = (lon: number, lat: number) => ({ x: (lon - point.longitude) * 111320 * Math.cos(point.latitude * Math.PI / 180), y: (lat - point.latitude) * 111320 });
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < geometry.coordinates.length; index += 1) {
    const startPair = geometry.coordinates[index - 1]; const endPair = geometry.coordinates[index];
    if (!startPair || !endPair) continue;
    const start = toXY(startPair[0], startPair[1]); const end = toXY(endPair[0], endPair[1]);
    const dx = end.x - start.x; const dy = end.y - start.y;
    const fraction = Math.max(0, Math.min(1, -(start.x * dx + start.y * dy) / (dx * dx + dy * dy || 1)));
    minimum = Math.min(minimum, Math.hypot(start.x + fraction * dx, start.y + fraction * dy));
  }
  return minimum;
}
<<<<<<< HEAD
=======

export default App;
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
