import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useActiveReportStore } from '@/store/activeReportStore';
import { useReports } from '@/hooks/use-reports';

const modernDivIcon = (label?: string) =>
  L.divIcon({
    className: 'my-pin',
    html: `
      <div class="gp-wrap">
        <svg class="gp-pin" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <radialGradient id="gpG" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#60a5fa"/>
              <stop offset="55%" stop-color="#3b82f6"/>
              <stop offset="100%" stop-color="#1d4ed8"/>
            </radialGradient>
            <filter id="gpShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
            </filter>
          </defs>
          <path d="M32 4c11 0 20 9 20 20 0 15-20 36-20 36S12 39 12 24C12 13 21 4 32 4z" fill="url(#gpG)" filter="url(#gpShadow)"/>
          <circle cx="26" cy="18" r="6" fill="rgba(255,255,255,.55)"/>
          <path d="M32 4c11 0 20 9 20 20 0 15-20 36-20 36S12 39 12 24C12 13 21 4 32 4z" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1"/>
        </svg>
        <div class="gp-pulse" aria-hidden="true"></div>
        ${label ? `<div class="gp-label">${label}</div>` : ''}
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 52],
    popupAnchor: [0, -52],
  });

const smallDivIcon = (opts?: {
  color?: string;
  pulse?: boolean;
  label?: string;
}) => {
  const color = opts?.color ?? '#ff0000';
  const pulse = opts?.pulse ?? false;
  const label = opts?.label;

  return L.divIcon({
    className: 'my-pin-mini',
    html: `
        <div class="gp-mini-wrap">
          <svg class="gp-mini-pin" viewBox="0 0 48 56" aria-hidden="true">
            <path d="M24 3c8 0 15 7 15 15 0 11-15 27-15 27S9 29 9 18C9 10 16 3 24 3z"
                  fill="${color}" />
            <circle cx="19" cy="15" r="4" fill="rgba(255,255,255,.6)"/>
            <path d="M24 3c8 0 15 7 15 15 0 11-15 27-15 27S9 29 9 18C9 10 16 3 24 3z"
                  fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1"/>
          </svg>
          ${pulse ? `<div class="gp-mini-pulse" aria-hidden="true"></div>` : ''}
          ${label ? `<div class="gp-mini-label">${label}</div>` : ''}
        </div>
      `,
    iconSize: [32, 38],
    iconAnchor: [16, 35],
    popupAnchor: [0, -34],
  });
};

const injectStylesOnce = (() => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const css = `
      .gp-wrap { position: relative; display: grid; place-items: center; }
      .gp-pin { width: 48px; height: 56px; display: block; }
      .gp-pulse {
        position: absolute; bottom: 2px;
        width: 10px; height: 10px; border-radius: 9999px;
        animation: gpPulse 2s infinite;
        background: rgba(59,130,246,.35);
        box-shadow: 0 0 0 0 rgba(59,130,246,.35);
      }
      @keyframes gpPulse {
        0% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        100% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }
      .gp-label {
        position: absolute; top: 2px;
        translate: 0 -100%;
        padding: 4px 8px; border-radius: 9999px;
        background: #111; color: #fff; font: 600 12px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        white-space: nowrap; box-shadow: 0 6px 16px rgba(0,0,0,.25);
      }
      .leaflet-popup-content-wrapper.my-popup,
      .leaflet-popup-tip.my-popup {
        border-radius: 12px;
      }
      .leaflet-popup-content-wrapper.my-popup {
        padding: 0; overflow: hidden;
        box-shadow: 0 12px 28px rgba(0,0,0,.22);
      }
      .my-card {
        padding: 10px 12px 12px 12px;
        background: #fff;
      }
      .my-title {
        margin: 0 0 4px 0;
        font: 700 15px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #0b1220;
      }
      .my-sub {
        margin: 0;
        font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #4b5563;
      }
      
      .gp-mini-wrap { position: relative; display: grid; place-items: center; }
      
      .gp-mini-pin { width: 32px; height: 38px; display: block; }

      .gp-mini-pulse {
        position: absolute; bottom: 2px;
        width: 8px; height: 8px; border-radius: 9999px;
        animation: gpPulse 2s infinite;
        background: rgba(16,185,129,.35);
        box-shadow: 0 0 0 0 rgba(16,185,129,.35);
      }
      .gp-mini-label {
        position: absolute; top: 2px;
        translate: 0 -100%;
        padding: 2px 6px; border-radius: 9999px;
        background: #111; color: #fff; font: 600 11px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        white-space: nowrap; box-shadow: 0 6px 16px rgba(0,0,0,.25);
      }

      /* Cluster marker styles */
      .marker-cluster-small {
        background-color: rgba(181, 226, 140, 0.6);
      }
      .marker-cluster-small div {
        background-color: rgba(110, 204, 57, 0.6);
      }
      .marker-cluster-medium {
        background-color: rgba(241, 211, 87, 0.6);
      }
      .marker-cluster-medium div {
        background-color: rgba(240, 194, 12, 0.6);
      }
      .marker-cluster-large {
        background-color: rgba(253, 156, 115, 0.6);
      }
      .marker-cluster-large div {
        background-color: rgba(241, 128, 23, 0.6);
      }
      .marker-cluster {
        background-clip: padding-box;
        border-radius: 20px;
      }
      .marker-cluster div {
        width: 30px;
        height: 30px;
        margin-left: 5px;
        margin-top: 5px;
        text-align: center;
        border-radius: 15px;
        font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
      }
      .marker-cluster span {
        line-height: 30px;
        color: #fff;
        font-weight: bold;
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-gp', '1');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  };
})();

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const setLocation = useActiveReportStore((state) => state.setLocation);
  const location = useActiveReportStore((state) => state.locationData);
  const clearLocation = useActiveReportStore((s) => s.clearLocation);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const { data: reports = [] } = useReports();

  useEffect(() => {
    injectStylesOnce();

    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      zoomAnimation: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelDebounceTime: 25,
    }).setView([45.0703, 7.6869], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=it`,
        );
        const data = await response.json();

        const rawAddress = data.display_name || 'Indirizzo non disponibile';
        const rawCity =
          data.address?.neighbourhood ||
          data.address?.quarter ||
          data.address?.suburb ||
          data.address?.city_district ||
          data.address?.borough ||
          'Unavailable Zone';

        const city = typeof rawCity === 'string' ? rawCity.trim() : '';
        const shortAddress =
          formatShortAddress(data.address, rawAddress) || rawAddress;

        setLocation({
          latitude: lat,
          longitude: lng,
          address: shortAddress,
          city,
        });
      } catch (error) {
        console.error('Errore nel recupero indirizzo:', error);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [setLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (!location) return;

    const { latitude, longitude, address, city } = location;

    const titleHTML = city
      ? `<h3 class="my-title">${escapeHtml(city)}</h3>`
      : '';

    const popupHTML = `
      <div class="my-card">
        ${titleHTML ? 'District: ' + titleHTML : ''}
        
        <br/>
        Nearest street address:
        <h3 class="my-title">${escapeHtml(address || 'Indirizzo non disponibile')}</h3>
        
      </div>
    `;

    const marker = L.marker([latitude, longitude], {
      icon: modernDivIcon(),
      alt: city || 'Posizione selezionata',
      keyboard: true,
      riseOnHover: true,
      title: city || 'Posizione selezionata',
    })
      .addTo(map)
      .bindPopup(popupHTML, {
        className: 'my-popup',
        autoPanPadding: [10, 10],
        maxWidth: 340,
        closeButton: true,
      })
      .openPopup();

    map.panTo([latitude, longitude], {
      animate: true,
      duration: 0.8,
      easeLinearity: 1.0,
    });

    markerRef.current = marker;
    map.setView([latitude, longitude], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [location]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Inizializza il MarkerClusterGroup se non esiste
    if (!markerClusterGroupRef.current) {
      markerClusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        animateAddingMarkers: true,
        disableClusteringAtZoom: 16, // Disabilita clustering ad alto zoom
        maxClusterRadius: 80,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          let size = 'small';
          let c = ' marker-cluster-';
          
          if (count < 10) {
            size = 'small';
            c += 'small';
          } else if (count < 50) {
            size = 'medium';
            c += 'medium';
          } else {
            size = 'large';
            c += 'large';
          }

          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster' + c,
            iconSize: L.point(40, 40),
          });
        },
      }).addTo(map);
    }

    const clusterGroup = markerClusterGroupRef.current;
    clusterGroup.clearLayers();

    if (!reports?.length) return;

    const baseColor = '#ff0000';

    reports.forEach((report: any) => {
      const [lng, lat] = report.location?.coordinates ?? [0, 0];
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const m = L.marker([lat, lng], {
        icon: smallDivIcon({ color: baseColor, pulse: false }),
        keyboard: true,
        title: report.address ?? 'Saved report',
        alt: report.address ?? 'Saved report',
        riseOnHover: true,
      });

      m.bindTooltip(report.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`, {
        direction: 'top',
        offset: [0, -18],
        opacity: 0.9,
      });

      m.on('click keypress', (ev: any) => {
        if (
          ev.type === 'keypress' &&
          !['Enter', ' '].includes(ev.originalEvent?.key)
        )
          return;
        setLocation({
          latitude: lat,
          longitude: lng,
          address: report.address ?? '',
          city: 'Unavailable Zone',
        });
      });

      clusterGroup.addLayer(m);
    });
  }, [reports, setLocation]);
  useEffect(() => {
    return () => {
      clearLocation();
    };
  }, [clearLocation]);
  return (
    <div
      ref={mapRef}
      className="h-full w-full rounded-lg overflow-hidden"
      aria-label="Mappa interattiva"
      role="region"
    />
  );
}

function escapeHtml(input: string) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pickStreet(a: any) {
  return (
    a?.road ||
    a?.pedestrian ||
    a?.footway ||
    a?.cycleway ||
    a?.path ||
    a?.residential ||
    a?.square ||
    a?.neighbourhood ||
    a?.suburb ||
    ''
  );
}

function formatShortAddress(addressObj: any, displayName?: string) {
  const street = (pickStreet(addressObj) || '').trim();
  const number = (addressObj?.house_number || '').toString().trim();

  if (street && number) return `${street}, ${number}`;
  if (street) return street;
  if (addressObj?.name) return addressObj.name;

  if (displayName) {
    const m: RegExpMatchArray | null =
      displayName.match(/\b(\d+[A-Za-z]?)\s*,\s*([^,]+)/) ||
      displayName.match(/([^,]+)\s*,\s*(\d+[A-Za-z]?)/);

    if (m) {
      const left = m[1]?.trim() ?? '';
      const right = m[2]?.trim() ?? '';
      const isNumLeft = /^\d+[A-Za-z]?$/.test(left);
      return isNumLeft ? `${right}, ${left}` : `${left}, ${right}`;
    }
    const [first, second] = displayName.split(',').map((s) => s.trim());
    if (first && /^\d+[A-Za-z]?$/.test(first) && second)
      return `${second}, ${first}`;
    if (first && second && /^\d/.test(second)) return `${first}, ${second}`;
    if (first) return first;
  }
  return '';
}
