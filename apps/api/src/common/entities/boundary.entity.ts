import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

type MultiPolygon = {
  type: 'MultiPolygon';
  coordinates: number[][][][];
};

@Entity('boundary')
export class Boundary {
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
