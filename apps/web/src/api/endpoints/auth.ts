import { apiFetch } from '../client';
import { LoginDto, RegisterDto } from '@repo/api';
import { LoginResponseDto, LogoutResponseDto } from '@repo/api';

export async function login(credentials: LoginDto): Promise<LoginResponseDto> {
  return apiFetch<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(data: RegisterDto): Promise<LoginResponseDto> {
  return apiFetch<LoginResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<LogoutResponseDto> {
  return apiFetch<LogoutResponseDto>('/auth/logout', {
    method: 'POST',
  });
}
