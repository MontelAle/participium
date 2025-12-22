import { useAuth } from '@/contexts/auth-context';
import { useFilteredReports } from '@/hooks/use-filtered-reports';
import { useActiveReportStore } from '@/store/activeReportStore';
import { Report, ReportStatus } from '@repo/api';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import type { NominatimSearchResult, StatusMarker } from '@/types';
import { MapControls } from './map-controls';
import { SearchBox } from './map-searchbox';
import {
  DEFAULT_COLOR,
  escapeHtml,
  formatShortAddress,
  getStatusBadgeHTML,
  getSvgIcon,
  injectStylesOnce,
  isPointInGeoJSON,
  modernDivIcon,
  smallDivIcon,
  STATUS_COLORS,
} from './map.utils';

export default function ReportsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryGeoJsonRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const isSelectingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const { isCitizenUser, isGuestUser } = useAuth();
  const setLocation = useActiveReportStore((state) => state.setLocation);
  const location = useActiveReportStore((state) => state.locationData);
  const clearLocation = useActiveReportStore((s) => s.clearLocation);
  const { reports: filteredReports } = useFilteredReports();

  const mapReports = useMemo(
    () => filteredReports.filter((report) => report.status !== 'rejected'),
    [filteredReports],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>(
    [],
  );
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    injectStylesOnce();
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
    }).setView([45.0703, 7.6869], 13);

    L.control.attribution({ prefix: false }).addTo(map);

    tileLayerRef.current = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      },
    ).addTo(map);

    const fetchTorinoBoundary = async () => {
      try {
        const response = await fetch(
          'https://nominatim.openstreetmap.org/search.php?q=Torino+Italy&polygon_geojson=1&format=json&limit=1',
        );
        const data = await response.json();
        if (data?.[0]?.geojson) {
          boundaryGeoJsonRef.current = data[0].geojson;
          L.geoJSON(data[0].geojson, {
            style: {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
            },
            interactive: false,
          }).addTo(map);
        }
      } catch (e) {
        console.error('Boundary error', e);
      }
    };
    fetchTorinoBoundary();

    if (!isGuestUser) {
      map.on('click', (e: L.LeafletMouseEvent) =>
        handleLocationSelect(e.latlng.lat, e.latlng.lng),
      );
    }
    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    if (mapType === 'standard') {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        },
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri',
        },
      ).addTo(map);
    }
  }, [mapType]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' Torino')}&format=json&addressdetails=1&limit=5&viewbox=7.5,45.15,7.8,45.0&bounded=1`,
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markerClusterGroupRef.current ??= L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      iconCreateFunction: (cluster) => {
        const children = cluster.getAllChildMarkers();
        const counts: Record<string, number> = {};
        children.forEach((marker: StatusMarker) => {
          const s = marker.status || 'UNKNOWN';
          counts[s] = (counts[s] || 0) + 1;
        });
        const dominantStatus = Object.keys(counts).reduce(
          (a, b) => ((counts[a] || 0) >= (counts[b] || 0) ? a : b),
          '',
        );
        const statusClass =
          STATUS_COLORS[dominantStatus as ReportStatus]?.class ||
          DEFAULT_COLOR.class;
        return L.divIcon({
          html: `<div><span>${cluster.getChildCount()}</span></div>`,
          className: `marker-cluster-custom ${statusClass}`,
          iconSize: L.point(40, 40),
        });
      },
    }).addTo(map);

    const clusterGroup = markerClusterGroupRef.current;
    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    if (!mapReports?.length) return;

    mapReports.forEach((report: Report) => {
      const [lng, lat] = report.location?.coordinates ?? [0, 0];
      if (!lat || !lng) return;

      const formattedDate = new Date(report.createdAt).toLocaleDateString(
        'en-En',
        { weekday: 'long', hour: '2-digit', minute: '2-digit' },
      );
      const idShort = report.id.slice(-6);
      const statusBadge = getStatusBadgeHTML(report.status);

      const popupDiv = document.createElement('div');
      popupDiv.className = 'font-sans bg-white min-w-[260px] p-4';
      let userHtml = '';
      if (report.user) {
        userHtml = `
          <div class="flex items-center gap-2 text-sm text-slate-500 mt-1">
            ${getSvgIcon('user')}
            <span class="capitalize">${escapeHtml(report.user.firstName)} ${escapeHtml(report.user.lastName)}</span>
          </div>
        `;
      } else {
        userHtml = `
          <div class="flex items-center gap-2 text-sm mt-1 text-indigo-500/80 font-medium italic">
            ${getSvgIcon('ghost')}
            <span>Anonymous Reporter</span>
          </div>
        `;
      }
      popupDiv.innerHTML = `
        <div class="flex items-start justify-between mb-2 pr-6">
          <div class="text-xs text-slate-500 uppercase font-bold tracking-wider pt-1">
            Report #${idShort}
          </div>
          ${statusBadge}
        </div>
        <div class="mb-1">
          <h3 class="font-bold text-lg leading-tight text-slate-900 mb-0.5">
            ${escapeHtml(report.title)}
          </h3>
          <p class="text-sm font-medium text-slate-500">
            ${escapeHtml(report.category.name)}
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600 mt-2">
          ${getSvgIcon('pin')}
          <span class="truncate max-w-[200px] block leading-tight">
            ${escapeHtml(report.address || 'No address')}
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-500 mt-1">
          ${getSvgIcon('calendar')}
          <span class="capitalize">${formattedDate}</span>
        </div>
        ${userHtml} 
      `;

      if (!isGuestUser) {
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'popup-btn-action mt-3';
        detailsBtn.textContent = 'SHOW DETAILS';
        detailsBtn.onclick = (e) => {
          e.stopPropagation();
          navigate(`/reports/view/${report.id}`);
        };
        popupDiv.appendChild(detailsBtn);
      }

      const m = L.marker([lat, lng], {
        icon: smallDivIcon({ status: report.status }),
        title: report.title,
      }) as StatusMarker;
      m.status = report.status;

      m.bindPopup(popupDiv, { className: 'my-popup', maxWidth: 320 });

      m.on('click', () => {
        handleLocationSelect(lat, lng, undefined, true);
      });

      m.on('popupclose', () => {
        clearLocation();
      });

      markersMapRef.current.set(report.id, m);
      clusterGroup.addLayer(m);
    });
  }, [mapReports, navigate]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !location) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const existingReport = mapReports.find(
      (r) =>
        Math.abs((r.location?.coordinates[1] ?? 0) - location.latitude) <
          0.00001 &&
        Math.abs((r.location?.coordinates[0] ?? 0) - location.longitude) <
          0.00001,
    );

    if (existingReport) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      const existingMarker = markersMapRef.current.get(existingReport.id);
      const clusterGroup = markerClusterGroupRef.current;

      if (existingMarker && clusterGroup) {
        clusterGroup.zoomToShowLayer(existingMarker, () => {
          existingMarker.setIcon(
            smallDivIcon({ status: existingReport.status, isSelected: true }),
          );

          existingMarker.openPopup();

          existingMarker.once('popupclose', () => {
            existingMarker.setIcon(
              smallDivIcon({
                status: existingReport.status,
                isSelected: false,
              }),
            );
            clearLocation();
          });
        });
      }
      return;
    }

    if (markerRef.current) markerRef.current.remove();

    const popupDiv = document.createElement('div');
    popupDiv.className = 'font-sans p-4 min-w-[260px]';

    popupDiv.innerHTML = `
      <p class="text-xs font-bold text-blue-500 uppercase mb-1">Selected Location</p>
      <h3 class="text-lg font-bold text-slate-900 leading-tight mb-3">${escapeHtml(location.address || '')}</h3>
    `;

    if (isCitizenUser) {
      const addBtn = document.createElement('button');
      addBtn.className = 'popup-btn-action';
      addBtn.textContent = 'ADD REPORT';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        navigate('/reports/create', { state: location });
      };
      popupDiv.appendChild(addBtn);
    } else {
      const msg = document.createElement('div');
      msg.className = 'text-xs text-center text-slate-400 mt-3 italic';
      msg.textContent = 'Log in to add a report';
      popupDiv.appendChild(msg);
    }

    const marker = L.marker([location.latitude, location.longitude], {
      icon: modernDivIcon(),
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup(popupDiv, { className: 'my-popup', maxWidth: 320 });

    marker.on('popupclose', () => {
      clearLocation();
    });

    map.flyTo([location.latitude, location.longitude], 16, { duration: 1.2 });
    setTimeout(() => marker.openPopup(), 300);
    markerRef.current = marker;
  }, [location, navigate, isCitizenUser, mapReports, clearLocation]);

  useEffect(() => {
    return () => clearLocation();
  }, [clearLocation]);

  const handleLocationSelect = async (
    lat: number,
    lng: number,
    prefilledResult?: NominatimSearchResult,
    skipBoundaryCheck = false,
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!skipBoundaryCheck && boundaryGeoJsonRef.current) {
      const inside = isPointInGeoJSON(lat, lng, boundaryGeoJsonRef.current);
      if (!inside) {
        toast.error('Outside boundaries', {
          description: 'You can only interact within Torino.',
          duration: 3000,
        });
        return;
      }
    }

    let resultData = prefilledResult;
    if (!resultData) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
        );
        resultData = await response.json();
      } catch (error) {
        console.error(error);
      }
    }
    const rawAddress = resultData?.display_name || 'Unknown Location';
    const city = resultData?.address?.city || 'Torino';
    const shortAddress = resultData
      ? formatShortAddress(resultData, rawAddress)
      : rawAddress;
    setLocation({ latitude: lat, longitude: lng, address: shortAddress, city });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported', {
        description: 'Your browser does not support geolocation.',
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`,
          );
          const data: NominatimSearchResult = await response.json();

          let label =
            data.address?.road ||
            data.display_name.split(',')[0] ||
            'Current Location';
          if (data.address?.road && data.address?.house_number) {
            label = `${data.address.road}, ${data.address.house_number}`;
          }

          isSelectingRef.current = true;
          setSearchQuery(label);
          setSearchResults([]);
          handleLocationSelect(latitude, longitude, data, false);

          toast.success('Location found', {
            description: `Located at ${label}`,
          });
        } catch (error) {
          console.error('Reverse geocoding failed', error);
          handleLocationSelect(latitude, longitude, undefined, false);
          setSearchQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        let msg = 'Unable to retrieve your location';
        if (error.code === 1) msg = 'Location permission denied';
        else if (error.code === 2) msg = 'Location unavailable';
        else if (error.code === 3) msg = 'Location request timed out';

        toast.error('Geolocation Error', { description: msg });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="relative h-full w-full group">
      <SearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        setSearchResults={setSearchResults}
        searchResults={searchResults}
        onSelect={(lat, lon, item) => {
          isSelectingRef.current = true;
          handleLocationSelect(lat, lon, item, false);
          setSearchResults([]);
          let label =
            item.address?.road || item.display_name.split(',')[0] || '';
          if (item.address?.road && item.address?.house_number) {
            label = `${item.address.road}, ${item.address.house_number}`;
          }
          setSearchQuery(label);
        }}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
      />

      <MapControls
        mapType={mapType}
        setMapType={setMapType}
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
      />

      <div ref={mapRef} className="h-full w-full bg-slate-100" />
    </div>
  );
}
