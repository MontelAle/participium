import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Office } from '../../common/entities/office.entity';
import { OfficesService } from './offices.service';

describe('OfficesService', () => {
  let service: OfficesService;
  let officeRepo: Repository<Office>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficesService,
        {
          provide: getRepositoryToken(Office),
          useValue: {
            find: jest.fn().mockResolvedValue([
              { id: '1', name: 'office1', label: 'Office 1' },
              { id: '2', name: 'office2', label: 'Office 2' },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<OfficesService>(OfficesService);
    officeRepo = module.get<Repository<Office>>(getRepositoryToken(Office));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all offices', async () => {
    const result = await service.findAll();
    expect(result).toEqual([
      { id: '1', name: 'office1', label: 'Office 1' },
      { id: '2', name: 'office2', label: 'Office 2' },
    ]);
    expect(officeRepo.find).toHaveBeenCalled();
  });
});
