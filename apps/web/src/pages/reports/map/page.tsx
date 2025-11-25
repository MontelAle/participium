import ReportsMap from '@/components/report-map/report-map';
import { Suspense } from 'react';

export default function MapPage() {
  return (
    <div className=" h-[calc(100vh-3rem)] w-full rounded-lg border bg-muted overflow-hidden ">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            Loading map...
          </div>
        }
      >
        <ReportsMap />
      </Suspense>
    </div>
  );
}
