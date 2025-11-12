import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useActiveReportStore } from '@/store/activeReportStore';

export function ReportsList() {
  const { data: reports = [] } = useReports();
  const setLocation = useActiveReportStore((state) => state.setLocation);

  const handleReportClick = (report: any) => {
    if (report.latitude && report.longitude) {
      setLocation({
        latitude: report.latitude,
        longitude: report.longitude,
        address: report.address,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {reports.map((report) => (
          <button
            key={report.id}
            className="w-full rounded-md border bg-card p-3 text-left hover:bg-accent"
            onClick={() => handleReportClick(report)}
          >
            <p className="font-medium">
              {report.location.coordinates.join(' - ')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
