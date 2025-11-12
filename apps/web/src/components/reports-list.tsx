import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useActiveReportStore } from '@/store/activeReportStore';

export function ReportsList() {
  const [search, setSearch] = useState('');
  const { data: reports = [] } = useReports();
  const setCoordinates = useActiveReportStore((state) => state.setCoordinates);

  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleReportClick = (report: any) => {
    if (report.latitude && report.longitude) {
      setCoordinates({
        latitude: report.latitude,
        longitude: report.longitude,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filtered.map((report) => (
          <button
            key={report.id}
            className="w-full rounded-md border bg-card p-3 text-left hover:bg-accent"
            onClick={() => handleReportClick(report)}
          >
            <p className="font-medium">{report.title}</p>
            <p className="text-xs text-muted-foreground">{report.status}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
