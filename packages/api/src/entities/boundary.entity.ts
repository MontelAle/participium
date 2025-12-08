export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface Boundary {
  id: string;
  name: string;
  label: string;
  geometry: MultiPolygon;
}
