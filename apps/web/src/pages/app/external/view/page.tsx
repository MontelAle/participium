/*
import { ReviewReportForm } from '@/components/assign-reports/review-report-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReport, useUpdateReport } from '@/hooks/use-reports';
import { cn, getStatusConfig } from '@/lib/utils';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ReportStatus } from '@repo/api';
import { useState } from 'react';

function AssignReportsStatusViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReport(id!);
  const updateReportMutation = useUpdateReport();
  const [status, setStatus] = useState<ReportStatus | undefined>(undefined);

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

  const statusConfig = getStatusConfig(report.status);
  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-En', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setStatus(newStatus);
    try {
      await updateReportMutation.mutateAsync({
        reportId: report.id,
        data: { status: newStatus },
      });
      toast.success('Report status updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update report status');
      setStatus(report.status); 
    }
  };

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">

        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="group pl-0 h-8 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
          >
            <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b md:border-b-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Report #{report.id.slice(-6)}
              </h1>

  
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm px-3 py-1 font-semibold border',
                    getStatusConfig(status || report.status).color
                  )}
                >
                  {getStatusConfig(status || report.status).label}
                </Badge>

                <Select
                  value={status || report.status}
                  onValueChange={(v) => handleStatusChange(v as ReportStatus)}
                >
                  <SelectTrigger className="w-fit">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReportStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-sm bg-white/60 px-3 py-1.5 rounded-md border border-border/40 w-fit">
              <CalendarDays className="size-4 text-primary/70" />
              <span className="font-medium">{formattedDate}</span>
            </div>
          </div>
        </div>

      
        <div className="flex-1 pb-2">
          <ReviewReportForm report={report} onClose={() => navigate(-1)} />
        </div>
      </div>
    </div>
  );
}

export default AssignReportsStatusViewPage;
*/

import { ReviewReportForm } from '@/components/assign-reports/review-report-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReport, useUpdateReport } from '@/hooks/use-reports';
import { cn, getStatusConfig } from '@/lib/utils';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ReportStatus } from '@repo/api';
import { useState } from 'react';

function AssignReportsStatusViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReport(id!);
  const updateReportMutation = useUpdateReport();
  const [status, setStatus] = useState<ReportStatus | undefined>(undefined);

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

  // Funzione per le transizioni di stato consentite
  const getNextStatusOptions = (currentStatus: ReportStatus) => {
    switch (currentStatus) {
      case ReportStatus.ASSIGNED:
        return [ReportStatus.IN_PROGRESS];
      case ReportStatus.IN_PROGRESS:
        return [ReportStatus.RESOLVED];
      default:
        return [];
    }
  };

  const nextStatusOptions = getNextStatusOptions(status || report.status);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setStatus(newStatus);
    try {
      await updateReportMutation.mutateAsync({
        reportId: report.id,
        data: { status: newStatus },
      });
      toast.success('Report status updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update report status');
      setStatus(report.status); 
    }
  };

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
                  getStatusConfig(status || report.status).color
                )}
              >
                {getStatusConfig(status || report.status).label}
              </Badge>

              <Select
                value={status || report.status}
                onValueChange={(v) => handleStatusChange(v as ReportStatus)}
                disabled={nextStatusOptions.length === 0}
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm bg-white/60 px-3 py-1.5 rounded-md border border-border/40 w-fit">
            <CalendarDays className="size-4 text-primary/70" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 pb-2">
          <ReviewReportForm report={report} onClose={() => navigate(-1)} />
        </div>

      </div>
    </div>
  );
}

export default AssignReportsStatusViewPage;

