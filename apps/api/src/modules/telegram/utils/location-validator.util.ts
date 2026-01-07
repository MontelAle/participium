import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boundary } from '@entities';

@Injectable()
export class LocationValidatorUtil {
  constructor(
    @InjectRepository(Boundary)
    private readonly boundaryRepository: Repository<Boundary>,
  ) {}

  async validateTurinBoundary(
    latitude: number,
    longitude: number,
  ): Promise<boolean> {
    const result = await this.boundaryRepository
      .createQueryBuilder('boundary')
      .where(
        `ST_Contains(boundary.geometry, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))`,
        { longitude, latitude },
      )
      .getOne();

    return !!result;
  }
}
