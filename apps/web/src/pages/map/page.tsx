import { lazy, Suspense } from 'react';

const Map = lazy(() => import('@/components/map'));

function MapPage() {
  return (
    <div className="relative h-[calc(100vh-3rem)] w-full rounded-lg border bg-muted overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading map...</div>}>
        <Map />
      </Suspense>
    </div>
  );
}

export default MapPage;