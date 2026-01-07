import { Boundary } from '@entities';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMockQueryBuilder } from '../__test-utils__/telegram-mocks';
import { LocationValidatorUtil } from './location-validator.util';

describe('LocationValidatorUtil', () => {
  let util: LocationValidatorUtil;
  let boundaryRepository: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = createMockQueryBuilder();

    boundaryRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationValidatorUtil,
        {
          provide: getRepositoryToken(Boundary),
          useValue: boundaryRepository,
        },
      ],
    }).compile();

    util = module.get<LocationValidatorUtil>(LocationValidatorUtil);
  });

  it('should be defined', () => {
    expect(util).toBeDefined();
  });

  describe('validateTurinBoundary', () => {
    it('should return true when location is within boundary', async () => {
      const mockBoundary = {
        id: 'torino',
        name: 'Torino',
        geometry: {},
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockBoundary);

      const result = await util.validateTurinBoundary(45.070312, 7.686864);

      expect(result).toBe(true);
      expect(boundaryRepository.createQueryBuilder).toHaveBeenCalledWith(
        'boundary',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ST_Contains(boundary.geometry, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))',
        { longitude: 7.686864, latitude: 45.070312 },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return false when location is outside boundary', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await util.validateTurinBoundary(40.0, 8.0);

      expect(result).toBe(false);
    });

    it('should pass correct parameters to PostGIS query', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'torino' });

      const latitude = 45.123456;
      const longitude = 7.654321;
      await util.validateTurinBoundary(latitude, longitude);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('ST_Contains'),
        { longitude, latitude },
      );
    });

    it('should handle edge coordinates correctly', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'torino' });

      const result = await util.validateTurinBoundary(0, 0);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.any(String),
        { longitude: 0, latitude: 0 },
      );
      expect(result).toBe(true);
    });
  });
});
