import { ReportForm } from '@/components/report/report-form';
import { MapPin } from 'lucide-react';

function ReportPage() {
  return (
    <div className="flex flex-col w-full h-full py-10 px-4 md:px-10 md:items-center md:justify-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center justify-center p-4 bg-primary/10 rounded-2xl shadow-sm w-fit">
            <MapPin className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              New Report
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Fill out the details to report a problem in your area
            </p>
          </div>
        </div>
        <ReportForm />
      </div>
    </div>
  );
}

export default ReportPage;
