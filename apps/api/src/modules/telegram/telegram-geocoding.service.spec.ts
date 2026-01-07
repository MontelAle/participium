import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { TelegramGeocodingService } from './telegram-geocoding.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramGeocodingService', () => {
  let service: TelegramGeocodingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramGeocodingService],
    }).compile();

    service = module.get<TelegramGeocodingService>(TelegramGeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reverseGeocode', () => {
    const latitude = 45.070312;
    const longitude = 7.686864;

    it('should return formatted address with road and house number', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'Via Roma, 1, Torino, Italy',
          address: {
            road: 'Via Roma',
            house_number: '1',
            city: 'Torino',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBe('Via Roma, 1');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1,
            'accept-language': 'en',
          },
          headers: {
            'User-Agent': 'Participium-TelegramBot/1.0',
          },
        },
      );
    });

    it('should return road name only if no house number', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'Via Roma, Torino, Italy',
          address: {
            road: 'Via Roma',
            city: 'Torino',
          },
        },
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBe('Via Roma');
    });

    it('should return display name first part if no address details', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'Piazza Castello, Torino, Italy',
        },
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBe('Piazza Castello');
    });

    it('should return display name first part if address exists but no road', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'City Center, Torino, Italy',
          address: {
            city: 'Torino',
          },
        },
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBe('City Center');
    });

    it('should return Unknown Location if display name is empty', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: '',
        },
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBe('Unknown Location');
    });

    it('should return null if no data returned', async () => {
      mockedAxios.get.mockResolvedValue({
        data: null,
      });

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toBeNull();
    });

    it('should pass correct parameters to Nominatim API', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'Test Location',
        },
      });

      await service.reverseGeocode(45.123, 7.654);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org'),
        expect.objectContaining({
          params: {
            lat: 45.123,
            lon: 7.654,
            format: 'json',
            addressdetails: 1,
            'accept-language': 'en',
          },
        }),
      );
    });

    it('should include User-Agent header', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          display_name: 'Test',
        },
      });

      await service.reverseGeocode(latitude, longitude);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': 'Participium-TelegramBot/1.0',
          },
        }),
      );
    });
  });
});
