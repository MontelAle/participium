import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Office } from '@repo/api';
import { Repository } from 'typeorm';

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
