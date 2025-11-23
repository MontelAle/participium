import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ReportStatus } from '@repo/api';
import {
  injectStylesOnce,
  modernDivIcon,
  smallDivIcon,
} from '@/components/report-map/map.utils';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  status?: ReportStatus;
  className?: string;
}

export function MiniMap({
  latitude,
  longitude,
  status,
  className,
}: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    injectStylesOnce();

    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const icon = status
      ? smallDivIcon({ status, isSelected: true })
      : modernDivIcon();

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    markerRef.current = marker;

    map.setView([latitude, longitude], 16);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [latitude, longitude, status]);

  return (
    <div
      ref={mapRef}
      className={cn(
        'w-full h-full min-h-[180px] bg-slate-100 overflow-hidden',
        'rounded-xl border border-slate-200 shadow-inner',
        className,
      )}
    />
  );
}
