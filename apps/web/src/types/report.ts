export type ReportData = {
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  address?: string;
  categoryId: string;
  photos: File[];
};

export type ReportsListProps = {
  onlyMyReports?: boolean;
  setIsMobileExpanded?: (expanded: boolean) => void;
};

export type CreateReportFormData = (reportData: ReportData) => FormData;

export const createReportFormData: CreateReportFormData = (reportData) => {
  const formData = new FormData();

  formData.append('title', reportData.title);
  formData.append('description', reportData.description);
  formData.append('longitude', String(reportData.longitude));
  formData.append('latitude', String(reportData.latitude));
  if (reportData.address) formData.append('address', reportData.address);
  formData.append('categoryId', reportData.categoryId);

  reportData.photos.forEach((photo) => {
    formData.append('images', photo);
  });

  return formData;
};
