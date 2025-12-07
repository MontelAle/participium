import * as React from 'react';

interface ReportsHeaderProps {
  title: string;
  description: string;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({ title, description }) => {
  return (
    <div classNameName="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};
};