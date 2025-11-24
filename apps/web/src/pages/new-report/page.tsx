import { useNavigate } from 'react-router-dom';
import { ReportForm } from '@/components/new-report/report-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ReportPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
        <div className="flex flex-col gap-1 shrink-0">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="group pl-0 h-8 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to map
            </Button>
          </div>

          <div className="flex items-center pb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              New Report
            </h1>
          </div>
        </div>

        <div className="flex-1 min-h-0 mb-2">
          <ReportForm />
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
