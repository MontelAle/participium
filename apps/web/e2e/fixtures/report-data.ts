import { mockOffices } from './auth-municipal-data.js';

export const mockCategories = [
  {
    id: 'cat-roads',
    name: 'Roads and Urban Furnishings',
    office: mockOffices[0],
  },
  {
    id: 'cat-lighting',
    name: 'Public Lighting',
    office: mockOffices[1],
  },
  {
    id: 'cat-waste',
    name: 'Waste',
    office: mockOffices[3],
  },
  {
    id: 'cat-barriers',
    name: 'Architectural Barriers',
    office: mockOffices[0],
  },
];

export const mockEmptyReports = {
  success: true,
  data: [],
};

export const mockCreatedReportResponse = {
  status: 201,
  contentType: 'application/json',
  body: JSON.stringify({
    success: true,
    data: {
      id: 'new-report-123',
      title: 'Deep pothole in the middle of the lane',
      description:
        'There is a very deep pothole in the center of the road. Dangerous for motorcycles.',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [7.6784, 45.0621],
      },
      address: 'Corso Vittorio Emanuele II, 50, Torino',
      images: ['pothole_1.jpg'],
      categoryId: 'cat-roads',
      category: mockCategories[0],
      userId: '123-uuid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
};

export const mockExistingReports = {
  success: true,
  data: [
    {
      id: 'report-1',
      title: 'Broken street lamp',
      description:
        'Street lamp totally burnt out, the sidewalk is pitch black.',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [7.69, 45.0695],
      },
      address: 'Via Po, 18, Torino',
      images: [],
      categoryId: 'cat-lighting',
      category: mockCategories[1],
      userId: 'user-1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'report-2',
      title: 'Overflowing bins',
      description: 'Trash is all over the floor, bins are full.',
      status: 'in_progress',
      location: {
        type: 'Point',
        coordinates: [7.683, 45.068],
      },
      address: 'Piazza San Carlo, Torino',
      images: ['trash_full.jpg'],
      categoryId: 'cat-waste',
      category: mockCategories[2],
      userId: 'user-2',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export function createMockReport(overrides: Partial<any> = {}) {
  return {
    id: `report-${Date.now()}`,
    title: 'Test Report',
    description: 'Test description',
    status: 'pending',
    location: {
      type: 'Point',
      coordinates: [7.6869, 45.0703],
    },
    address: 'Piazza Castello, Torino',
    images: [],
    categoryId: 'cat-roads',
    category: mockCategories[0],
    userId: '123-uuid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
