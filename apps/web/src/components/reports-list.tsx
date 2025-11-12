import { useReports } from '@/hooks/use-reports';
import { useActiveReportStore } from '@/store/activeReportStore';
import type { Report } from '@repo/api';

export function ReportsList() {
  const { data: reports = [] } = useReports();
  const setLocation = useActiveReportStore((state) => state.setLocation);

  const handleReportClick = (report: Report) => {
    setLocation({
      latitude: report.location.coordinates[1] ?? 0,
      longitude: report.location.coordinates[0] ?? 0,
      address: report.address,
    });
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
