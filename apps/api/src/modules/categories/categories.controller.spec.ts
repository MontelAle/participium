import { Category } from '@entities';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesResponseDto } from './dto/category.dto';

class MockSessionGuard {
  canActivate() {
    return true;
  }
}

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategories: Partial<Category>[] = [
    { id: '1', name: 'Cat 1' },
    { id: '2', name: 'Cat 2' },
  ];

  const mockCategoriesService = {
    findAll: jest.fn().mockResolvedValue(mockCategories),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    })
      .overrideGuard(SessionGuard)
      .useClass(MockSessionGuard)
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should return CategoriesResponseDto', async () => {
      const result: CategoriesResponseDto = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        success: true,
        data: mockCategories,
      });
    });
  });
});
