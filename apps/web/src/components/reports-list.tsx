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
      city: 'Unavailable Zone',
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {reports.map((report) => (
          <button
            key={report.id}
            className="w-full rounded-md border bg-card p-3 text-left hover:bg-accent"
            onClick={() => handleReportClick(report)}
          >
            <p className="font-medium">
              {report.title}
            </p>
            <p className="text-sm text-muted-foreground">
              Category : {report.category?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Address : {report.address ?? ''}
            </p>
            <p className="text-sm text-muted-foreground">
              Coordinates : {report.location.coordinates.join(' - ')}
            </p>
            <p className="text-sm text-muted-foreground">
              Description : {report.description}
            </p>
            {report.images && report.images.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {report.images.map((img, index) => (
                  <img
                    key={index}
                    src={img} 
                    alt={`Immagine del report ${report.title}`}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
