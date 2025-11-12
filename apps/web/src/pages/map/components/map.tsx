import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useActiveReportStore } from '@/store/activeReportStore';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const setCoordinates = useActiveReportStore((state) => state.setCoordinates);
  const coordinates = useActiveReportStore((state) => state.coordinates);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([45.0703, 7.6869], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setCoordinates({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [setCoordinates]);

  // Show only one marker at the coordinates in the store
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove previous marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Add new marker if coordinates exist
    if (coordinates) {
      markerRef.current = L.marker([
        coordinates.latitude,
        coordinates.longitude,
      ]).addTo(mapInstanceRef.current);
      mapInstanceRef.current.setView(
        [coordinates.latitude, coordinates.longitude],
        mapInstanceRef.current.getZoom(),
      );
    }
  }, [coordinates]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
