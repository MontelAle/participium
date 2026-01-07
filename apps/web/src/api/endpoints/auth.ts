import {
  LoginDto,
  LoginResponseDto,
  LogoutResponseDto,
  RegisterDto,
  RegisterResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from '@/types';
import { apiFetch } from '../client';

export async function login(credentials: LoginDto): Promise<LoginResponseDto> {
  return apiFetch<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(
  data: RegisterDto,
): Promise<RegisterResponseDto> {
  return apiFetch<RegisterResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<LogoutResponseDto> {
  return apiFetch<LogoutResponseDto>('/auth/logout', {
    method: 'POST',
  });
}

export async function verifyEmail(
  data: VerifyEmailDto,
): Promise<VerifyEmailResponseDto> {
  return apiFetch<VerifyEmailResponseDto>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}



