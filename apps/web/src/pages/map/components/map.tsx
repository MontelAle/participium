import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useActiveReportStore } from '@/store/activeReportStore';

// 🎯 Custom pin (più moderno)
const customIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const setLocation = useActiveReportStore((state) => state.setLocation);
  const location = useActiveReportStore((state) => state.locationData);

  // Inizializzazione mappa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([45.0703, 7.6869], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Click handler per coordinate + reverse geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        );
        const data = await response.json();

        const address = data.display_name || 'Indirizzo non disponibile';
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          'Località sconosciuta';

        setLocation({ latitude: lat, longitude: lng, address, city });
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

  // Gestione marker e popup
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (location) {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: customIcon,
      }).addTo(mapInstanceRef.current);

      marker
        .bindPopup(
          `
        <div style="
          font-family: system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          padding: 8px;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        ">
          <strong style="font-size: 16px; color: #111;">${location.city}</strong><br/>
          <span style="color: #555;">${location.address}</span>
        </div>
      `,
        )
        .openPopup();

      markerRef.current = marker;
      mapInstanceRef.current.setView(
        [location.latitude, location.longitude],
        15,
      );
    }
  }, [location]);

  return (
    <div ref={mapRef} className="h-full w-full rounded-lg overflow-hidden" />
  );
}
