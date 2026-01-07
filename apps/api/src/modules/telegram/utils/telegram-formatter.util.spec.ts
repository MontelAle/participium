import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramFormatterUtil } from './telegram-formatter.util';

describe('TelegramFormatterUtil', () => {
  let util: TelegramFormatterUtil;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'app.frontendUrl': 'https://example.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramFormatterUtil,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    util = module.get<TelegramFormatterUtil>(TelegramFormatterUtil);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(util).toBeDefined();
  });

  describe('isLocalhost', () => {
    it('should return true for localhost URLs', () => {
      expect(util.isLocalhost('http://localhost:3000')).toBe(true);
    });

    it('should return true for 127.0.0.1 URLs', () => {
      expect(util.isLocalhost('http://127.0.0.1:3000')).toBe(true);
    });

    it('should return false for production URLs', () => {
      expect(util.isLocalhost('https://example.com')).toBe(false);
    });

    it('should return true for URLs containing localhost substring', () => {
      expect(util.isLocalhost('https://notlocalhost.com')).toBe(true);
    });
  });

  describe('formatLinkMessage', () => {
    it('should format with code block for localhost URLs', () => {
      const result = util.formatLinkMessage(
        'Welcome',
        'http://localhost:3000/link',
        'Click here',
      );

      expect(result).toBe(
        'Welcome\n\n👉 <b>Click here:</b>\n<code>http://localhost:3000/link</code>',
      );
    });

    it('should format with HTML link for production URLs', () => {
      const result = util.formatLinkMessage(
        'Welcome',
        'https://example.com/link',
        'Click here',
      );

      expect(result).toBe(
        'Welcome\n\n<a href="https://example.com/link">Click here</a>',
      );
    });

    it('should handle empty text', () => {
      const result = util.formatLinkMessage(
        '',
        'https://example.com/link',
        'Click here',
      );

      expect(result).toBe(
        '\n\n<a href="https://example.com/link">Click here</a>',
      );
    });

    it('should format with code block for 127.0.0.1 URLs', () => {
      const result = util.formatLinkMessage(
        'Test',
        'http://127.0.0.1:3000/page',
        'Link',
      );

      expect(result).toContain('<code>http://127.0.0.1:3000/page</code>');
    });
  });

  describe('getFrontendUrl', () => {
    it('should return base URL when no path provided', () => {
      const result = util.getFrontendUrl();
      expect(result).toBe('https://example.com');
    });

    it('should return base URL when empty string provided', () => {
      const result = util.getFrontendUrl('');
      expect(result).toBe('https://example.com');
    });

    it('should concatenate path with leading slash', () => {
      const result = util.getFrontendUrl('/reports/map');
      expect(result).toBe('https://example.com/reports/map');
    });

    it('should concatenate path without leading slash', () => {
      const result = util.getFrontendUrl('reports/map');
      expect(result).toBe('https://example.com/reports/map');
    });

    it('should handle base URL with trailing slash', () => {
      configService.get.mockReturnValueOnce('https://example.com/');
      const result = util.getFrontendUrl('/reports');
      expect(result).toBe('https://example.com/reports');
    });

    it('should handle both base URL and path with slashes correctly', () => {
      configService.get.mockReturnValueOnce('https://example.com/');
      const result = util.getFrontendUrl('/reports/view/123');
      expect(result).toBe('https://example.com/reports/view/123');
    });

    it('should handle complex paths', () => {
      const result = util.getFrontendUrl('/reports/view/abc-123');
      expect(result).toBe('https://example.com/reports/view/abc-123');
    });
  });
});
