import * as React from 'react';
import { ReportsTable } from '@/components/assign-reports/report-list-table';

interface ReportsTableSectionProps {
  data: any[];
  viewBasePath: string;
}

export const ReportsTableSection: React.FC<ReportsTableSectionProps> = ({
  data,
  viewBasePath,
}) => {
  return (
    <div className="overflow-hidden">
      <ReportsTable data={data} viewBasePath={viewBasePath} />
    </div>
  );
};