import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Office } from '../../common/entities/office.entity';

@Injectable()
export class OfficesService {
  constructor(
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
  ) {}

  async findAll(): Promise<Office[]> {
    return this.officeRepository.find();
  }
}
