import { ReportStatus } from '@repo/api';
import { isAfter, isSameDay, subMonths, subWeeks } from 'date-fns';
import L from 'leaflet';

export const STATUS_COLORS = {
  [ReportStatus.PENDING]: {
    hex: '#eab308',
    label: 'Pending',
    class: 'cluster-pending',
    badgeClass: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  },
  [ReportStatus.IN_PROGRESS]: {
    hex: '#3b82f6',
    label: 'In Progress',
    class: 'cluster-progress',
    badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-200',
  },
  [ReportStatus.RESOLVED]: {
    hex: '#22c55e',
    label: 'Resolved',
    class: 'cluster-resolved',
    badgeClass: 'bg-green-500/15 text-green-700 border-green-200',
  },
  [ReportStatus.REJECTED]: {
    hex: '#ef4444',
    label: 'Rejected',
    class: 'cluster-rejected',
    badgeClass: 'bg-red-500/15 text-red-700 border-red-200',
  },
  [ReportStatus.ASSIGNED]: {
    hex: '#8112b5ff',
    label: 'Assigned',
    class: 'cluster-assigned',
    badgeClass: 'bg-purple-500/15 text-purple-700 border-purple-200',
  },
};

export const DEFAULT_COLOR = {
  hex: '#64748b',
  label: 'Unknown',
  class: 'cluster-default',
  badgeClass: 'bg-gray-100 text-gray-700',
};

export const modernDivIcon = (label?: string) =>
  L.divIcon({
    className: 'my-pin',
    html: `
      <div class="gp-wrap">
        <svg class="gp-pin" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <filter id="gpShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
            </filter>
          </defs>
          <path d="M32 4c11 0 20 9 20 20 0 15-20 36-20 36S12 39 12 24C12 13 21 4 32 4z" fill="#3b82f6" filter="url(#gpShadow)"/>
          <circle cx="26" cy="18" r="6" fill="rgba(255,255,255,.55)"/>
        </svg>
        <div class="gp-pulse" aria-hidden="true"></div>
        ${label ? `<div class="gp-label">${label}</div>` : ''}
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 52],
    popupAnchor: [0, -52],
  });

export const smallDivIcon = (opts?: {
  status?: string;
  isSelected?: boolean;
}) => {
  const status = opts?.status as ReportStatus;
  const config = STATUS_COLORS[status] || DEFAULT_COLOR;
  const isSelected = opts?.isSelected ?? false;

  return L.divIcon({
    className: `my-pin-mini ${isSelected ? 'selected-pin' : ''}`,
    html: `
        <div class="gp-mini-wrap ${isSelected ? 'scale-125' : ''}">
          <svg class="gp-mini-pin" viewBox="0 0 48 56" aria-hidden="true" style="filter: ${isSelected ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'}">
            <path d="M24 3c8 0 15 7 15 15 0 11-15 27-15 27S9 29 9 18C9 10 16 3 24 3z" fill="${config.hex}" />
            <circle cx="19" cy="15" r="4" fill="rgba(255,255,255,.6)"/>
            <path d="M24 3c8 0 15 7 15 15 0 11-15 27-15 27S9 29 9 18C9 10 16 3 24 3z" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          </svg>
        </div>
      `,
    iconSize: [32, 38],
    iconAnchor: [16, 35],
    popupAnchor: [0, -34],
  });
};

export const injectStylesOnce = (() => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const css = `
      .gp-wrap, .gp-mini-wrap { position: relative; display: grid; place-items: center; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .gp-pin { width: 48px; height: 56px; display: block; }
      .gp-mini-pin { width: 32px; height: 38px; display: block; transition: transform 0.2s; }
      .gp-mini-wrap:hover .gp-mini-pin { transform: scale(1.1) translateY(-2px); }
      .selected-pin { z-index: 9999 !important; }
      .scale-125 { transform: scale(1.15); }
      .gp-pulse {
        position: absolute; bottom: 2px; width: 10px; height: 10px; border-radius: 9999px;
        animation: gpPulse 2s infinite; background: rgba(59,130,246,.35);
      }
      @keyframes gpPulse {
        0% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        100% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }
      .leaflet-popup-content-wrapper.my-popup {
        border-radius: 12px; padding: 0; overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .leaflet-popup-content { margin: 0 !important; width: 100% !important; }
      .leaflet-container a.leaflet-popup-close-button {
        top: 12px; right: 12px; color: #94a3b8; font-size: 24px; 
        padding: 4px; z-index: 20; width: 24px; height: 24px; 
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; background: rgba(255,255,255,0.8);
        backdrop-filter: blur(2px); transition: all 0.2s;
      }
      .leaflet-container a.leaflet-popup-close-button:hover {
        color: #ef4444; background: #fff;
      }
      .popup-btn-action {
        display: flex; align-items: center; justify-content: center;
        width: 100%; margin-top: 12px; padding: 10px;
        background-color: #3b82f6; color: white; font-weight: 600; font-size: 14px;
        border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s;
      }
      .popup-btn-action:hover { background-color: #2563eb; }
      .popup-badge {
        display: inline-flex; align-items: center; padding: 2px 8px;
        border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid transparent;
        text-transform: capitalize;
      }
      .marker-cluster-custom {
        background-clip: padding-box; border-radius: 20px; color: white;
        font-weight: bold; font-family: sans-serif; text-align: center; line-height: 40px;
      }
      .marker-cluster-custom div {
        width: 30px; height: 30px; margin-left: 5px; margin-top: 5px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;
      }
      .cluster-pending { background-color: rgba(234, 179, 8, 0.6); } .cluster-pending div { background-color: rgba(234, 179, 8, 0.9); }
      .cluster-progress { background-color: rgba(59, 130, 246, 0.6); } .cluster-progress div { background-color: rgba(59, 130, 246, 0.9); }
      .cluster-resolved { background-color: rgba(34, 197, 94, 0.6); } .cluster-resolved div { background-color: rgba(34, 197, 94, 0.9); }
      .cluster-rejected { background-color: rgba(239, 68, 68, 0.6); } .cluster-rejected div { background-color: rgba(239, 68, 68, 0.9); }
      .cluster-default { background-color: rgba(100, 116, 139, 0.6); } .cluster-default div { background-color: rgba(100, 116, 139, 0.9); }
    `;
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  };
})();

export function getSvgIcon(type: 'calendar' | 'pin' | 'user' | 'ghost') {
  if (type === 'calendar') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`;
  }
  if (type === 'pin') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  }
  if (type === 'user') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
  if (type === 'ghost') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>`;
  }
  return '';
}

export function getStatusBadgeHTML(status: ReportStatus) {
  const config = STATUS_COLORS[status] || DEFAULT_COLOR;
  return `<span class="popup-badge ${config.badgeClass}">${config.label}</span>`;
}

type Coordinate = [number, number];
type Ring = Coordinate[];
type Polygon = Ring[];

interface GeoJSON {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: Polygon | Polygon[];
}

function normalizeGeoJSONPolygons(geoJson: GeoJSON): Polygon[] {
  if (geoJson.type === 'MultiPolygon') {
    return geoJson.coordinates as Polygon[];
  }
  return [geoJson.coordinates as Polygon];
}

function extractRingsFromPolygon(polygon: Polygon): Ring[] {
  if (Array.isArray(polygon[0]) && typeof polygon[0][0] === 'number') {
    return [polygon] as unknown as Ring[];
  }
  return polygon;
}

function rayIntersectsEdge(
  pointX: number,
  pointY: number,
  edgeStart: Coordinate,
  edgeEnd: Coordinate,
): boolean {
  const [x1, y1] = edgeStart;
  const [x2, y2] = edgeEnd;

  const crossesVertically = y1 > pointY !== y2 > pointY;
  if (!crossesVertically) {
    return false;
  }

  const intersectionX = ((x2 - x1) * (pointY - y1)) / (y2 - y1) + x1;
  
  return pointX < intersectionX;
}

function isPointInRing(pointX: number, pointY: number, ring: Ring): boolean {
  let isInside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const currentVertex = ring[i];
    const previousVertex = ring[j];

    if (!currentVertex || !previousVertex) {
      continue;
    }

    if (rayIntersectsEdge(pointX, pointY, previousVertex, currentVertex)) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointInPolygonRings(
  pointX: number,
  pointY: number,
  rings: Ring[],
): boolean {
  for (const ring of rings) {
    if (isPointInRing(pointX, pointY, ring)) {
      return true;
    }
  }
  return false;
}

export function isPointInGeoJSON(
  lat: number,
  lng: number,
  geoJson: GeoJSON | null | undefined,
): boolean {
  if (!geoJson) {
    return true;
  }

  const pointX = lng;
  const pointY = lat;
  const polygons = normalizeGeoJSONPolygons(geoJson);

  for (const polygon of polygons) {
    const rings = extractRingsFromPolygon(polygon);
    if (isPointInPolygonRings(pointX, pointY, rings)) {
      return true;
    }
  }

  return false;
}

export function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatShortAddress(addr: any, raw: string) {
  const street = (addr?.road || addr?.pedestrian || addr?.path || '').trim();
  const number = (addr?.house_number || '').toString().trim();
  if (street && number) return `${street}, ${number}`;
  return street || raw.split(',')[0];
}

export function filterReportsLogic(
  reports: any[],
  debouncedSearchTerm: string,
  filters: any,
) {
  return reports.filter((report) => {
    if (debouncedSearchTerm.trim() !== '') {
      const term = debouncedSearchTerm.toLowerCase();
      const matches =
        report.title.toLowerCase().includes(term) ||
        (report.address?.toLowerCase().includes(term)) ||
        report.category.name.toLowerCase().includes(term);
      if (!matches) return false;
    }

    if (filters.status && report.status !== filters.status) return false;
    if (filters.category && report.category.name !== filters.category)
      return false;

    const reportDate = new Date(report.createdAt);
    const today = new Date();

    if (filters.dateRange) {
      if (filters.dateRange === 'Today') {
        if (!isSameDay(reportDate, today)) return false;
      } else if (filters.dateRange === 'Last Week') {
        if (!isAfter(reportDate, subWeeks(today, 1))) return false;
      } else if (filters.dateRange === 'This Month') {
        if (!isAfter(reportDate, subMonths(today, 1))) return false;
      }
    }

    if (filters.customDate?.from) {
      const { from, to } = filters.customDate;
      const cleanFrom = new Date(from);
      cleanFrom.setHours(0, 0, 0, 0);
      const cleanReportDate = new Date(reportDate);
      cleanReportDate.setHours(0, 0, 0, 0);

      if (cleanReportDate < cleanFrom) return false;
      if (to) {
        const cleanTo = new Date(to);
        cleanTo.setHours(23, 59, 59, 999);
        if (reportDate > cleanTo) return false;
      }
    }
    return true;
  });
}
