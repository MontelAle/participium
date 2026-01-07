import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface NominatimResponse {
  display_name: string;
  address?: NominatimAddress;
}

@Injectable()
export class TelegramGeocodingService {
  private readonly logger = new Logger(TelegramGeocodingService.name);
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org';

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const response = await axios.get<NominatimResponse>(
        `${this.NOMINATIM_API}/reverse`,
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

      const data = response.data;

      if (!data) {
        return null;
      }

      return this.formatAddress(data);
    } catch (error) {
      this.logger.error(
        `Reverse geocoding failed for ${latitude}, ${longitude}:`,
        error,
      );
      return null;
    }
  }

  private formatAddress(data: NominatimResponse): string {
    const address = data.address;

    if (!address) {
      return data.display_name.split(',')[0] || 'Unknown Location';
    }

    if (address.road && address.house_number) {
      return `${address.road}, ${address.house_number}`;
    }

    if (address.road) {
      return address.road;
    }

    return data.display_name.split(',')[0] || 'Unknown Location';
  }
}
