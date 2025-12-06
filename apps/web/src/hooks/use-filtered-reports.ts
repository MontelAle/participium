import { useAuth } from '@/contexts/auth-context';
import { useReports } from '@/hooks/use-reports';
import { useFilterStore } from '@/store/filterStore';
import { isAfter, isSameDay, subMonths, subWeeks } from 'date-fns';
import { useMemo } from 'react';

export function useFilteredReports() {
  const { user, isCitizenUser, isGuestUser } = useAuth();

  const { data: reports = [], isLoading } = useReports({
    enabled: !isGuestUser,
  });

  const { searchTerm, filters, showOnlyMyReports } = useFilterStore();

  const filteredReports = useMemo(() => {
    if (isGuestUser) return [];

    return reports.filter((report) => {
      if (showOnlyMyReports && user) {
        if (report.userId !== user.id) return false;
      }

      if (isCitizenUser) {
        if (report.status === 'pending') {
          return false;
        }

        //the user can only see his rejected reports
        if (report.status === 'rejected' && report.userId !== user?.id) {
          return false;
        }
      }

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matches =
          report.title.toLowerCase().includes(term) ||
          report.address?.toLowerCase().includes(term) ||
          report.category.name.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (filters) {
        if (filters.status && report.status !== filters.status) return false;
        if (filters.category && report.category.name !== filters.category)
          return false;

        const reportDate = new Date(report.createdAt);
        const today = new Date();

        if (filters.dateRange) {
          if (filters.dateRange === 'Today') {
            if (!isSameDay(reportDate, today)) return false;
          } else if (filters.dateRange === 'Last Week') {
            if (!isAfter(reportDate, subWeeks(today, 1))) return false;
          } else if (filters.dateRange === 'This Month') {
            if (!isAfter(reportDate, subMonths(today, 1))) return false;
          }
        }

        if (filters.customDate?.from) {
          const { from, to } = filters.customDate;
          const cleanFrom = new Date(from);
          cleanFrom.setHours(0, 0, 0, 0);
          const cleanReportDate = new Date(reportDate);
          cleanReportDate.setHours(0, 0, 0, 0);

          if (cleanReportDate < cleanFrom) return false;

          if (to) {
            const cleanTo = new Date(to);
            cleanTo.setHours(23, 59, 59, 999);
            if (reportDate > cleanTo) return false;
          }
        }
      }

      return true;
    });
  }, [
    reports,
    user,
    isCitizenUser,
    isGuestUser,
    searchTerm,
    filters,
    showOnlyMyReports,
  ]);

  return { reports: filteredReports, isLoading, totalReports: reports.length };
}
