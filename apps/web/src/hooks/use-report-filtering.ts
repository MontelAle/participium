import type { Report } from '@/types';
import { useMemo, useState } from 'react';

export function useReportFiltering(inputData: Report[]) {
  const [query, setQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const availableStatuses = useMemo(() => {
    const setStatus = new Set<string>();
    for (const r of inputData) {
      if (r.status) setStatus.add(r.status);
    }
    return Array.from(setStatus).sort((a, b) => a.localeCompare(b));
  }, [inputData]);

  const availableCategories = useMemo(() => {
    const setCategories = new Set<string>();
    for (const r of inputData) {
      if (r.category?.name) setCategories.add(r.category.name);
    }
    return Array.from(setCategories).sort((a, b) => a.localeCompare(b));
  }, [inputData]);

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return inputData.filter((r) => {
      const matchesQuery =
        !normalizedQuery ||
        String(r.title ?? '')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(r.status);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(r.category?.name ?? '');

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [inputData, query, selectedStatuses, selectedCategories]);

  return {
    query,
    setQuery,
    selectedStatuses,
    setSelectedStatuses,
    availableStatuses,
    selectedCategories,
    setSelectedCategories,
    availableCategories,
    filteredData,
  };
}
