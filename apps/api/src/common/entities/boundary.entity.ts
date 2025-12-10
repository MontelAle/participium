import type { Boundary as BoundaryType, MultiPolygon } from '@repo/api';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('boundary')
export class Boundary implements BoundaryType {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { unique: true })
  name: string;

  @Column('varchar')
  label: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
  })
  geometry: MultiPolygon;
}
