import { ViewAssignedExternalReport } from '@/components/external/view-report-form';
import { ReportComments } from '@/components/shared/report-comments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReport } from '@/hooks/use-reports';
import { cn, getStatusConfig } from '@/lib/utils';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

function AssignReportsStatusViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReport(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-lg text-gray-600 font-medium">
          Loading report...
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return <Navigate to="/reports" replace />;
  }

  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-En', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
        {/* Bottone Back */}
        <div className="flex justify-start gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="group pl-0 h-8 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
          >
            <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
        </div>

        {/* Header Report */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b md:border-b-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Report #{report.id.slice(-6)}
            </h1>

            {/* Badge + Select */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-sm px-3 py-1 font-semibold border',
                  getStatusConfig(report.status).color,
                )}
              >
                {getStatusConfig(report.status).label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm bg-white/60 px-3 py-1.5 rounded-md border border-border/40 w-fit">
            <CalendarDays className="size-4 text-primary/70" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 pb-2">
          <ViewAssignedExternalReport
            report={report}
            showAnonymous={false}
            onClose={() => navigate(-1)}
          />
        </div>

        <ReportComments reportId={id!} />
      </div>
    </div>
  );
}

export default AssignReportsStatusViewPage;
