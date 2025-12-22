import { useAuth } from '@/contexts/auth-context';
import { useReports } from '@/hooks/use-reports';
import { useFilterStore } from '@/store/filterStore';
import type { ReportFilters } from '@/types/index';
import { DateCheckStrategy } from '@/types/ui';
import type { Report, User } from '@repo/api';
import {
  endOfDay,
  isAfter,
  isSameDay,
  startOfDay,
  subMonths,
  subWeeks,
} from 'date-fns';
import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';

const failsPermissionCheck = (
  report: Report,
  user: User | null,
  isCitizenUser: boolean,
  showOnlyMyReports: boolean,
): boolean => {
  if (showOnlyMyReports && user && report.userId !== user.id) {
    return true;
  }

  if (isCitizenUser) {
    if (report.status === 'pending') {
      return true;
    }
    if (report.status === 'rejected' && report.userId !== user?.id) {
      return true;
    }
  }

  return false;
};

const failsSearchCheck = (report: Report, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return false;

  const term = searchTerm.toLowerCase();
  const titleMatch = report.title.toLowerCase().includes(term);
  const addressMatch = report.address?.toLowerCase().includes(term);
  const categoryMatch = report.category?.name.toLowerCase().includes(term);

  return !(titleMatch || addressMatch || categoryMatch);
};

const failsStaticFilters = (
  report: Report,
  filters: ReportFilters,
): boolean => {
  if (!filters) return false;

  if (filters.status && report.status !== filters.status) return true;
  if (filters.category && report.category?.name !== filters.category)
    return true;

  return false;
};

const DATE_RANGE_STRATEGIES: Record<string, DateCheckStrategy> = {
  Today: (date, today) => !isSameDay(date, today),
  'Last Week': (date, today) => !isAfter(date, subWeeks(today, 1)),
  'This Month': (date, today) => !isAfter(date, subMonths(today, 1)),
};

const failsCustomDateCheck = (
  reportDate: Date,
  customDate: DateRange,
): boolean => {
  if (!customDate?.from) return false;

  const fromDate = startOfDay(new Date(customDate.from));
  if (reportDate < fromDate) return true;

  if (customDate.to) {
    const toDate = endOfDay(new Date(customDate.to));
    if (reportDate > toDate) return true;
  }

  return false;
};

const failsDateCheck = (
  report: Report,
  filters: ReportFilters,
  today: Date,
): boolean => {
  if (!filters) return false;

  const reportDate = new Date(report.createdAt);

  if (filters.dateRange) {
    const strategy = DATE_RANGE_STRATEGIES[filters.dateRange];
    if (strategy?.(reportDate, today)) {
      return true;
    }
  }

  if (filters.customDate) {
    if (failsCustomDateCheck(reportDate, filters.customDate)) {
      return true;
    }
  }

  return false;
};

export function useFilteredReports() {
  const { user, isCitizenUser, isGuestUser } = useAuth();

  const { data: reports = [], isLoading } = useReports();

  const { searchTerm, filters, showOnlyMyReports } = useFilterStore();

  const filteredReports = useMemo(() => {
    if (!reports.length) return [];

    const today = new Date();

    return reports.filter((report) => {
      if (
        failsPermissionCheck(report, user, isCitizenUser, showOnlyMyReports)
      ) {
        return false;
      }

      if (failsStaticFilters(report, filters)) {
        return false;
      }

      if (failsDateCheck(report, filters, today)) {
        return false;
      }

      if (failsSearchCheck(report, searchTerm)) {
        return false;
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
