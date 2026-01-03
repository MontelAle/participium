import * as authApi from '@/api/endpoints/auth';
import type { LoginDto, RegisterDto, VerifyEmailDto, LoginResponseDto, RegisterResponseDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginDto) => authApi.login(credentials),
    onSuccess: (response) => {
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      queryClient.setQueryData(['auth', 'user'], userData);
    },
  });
}

/*
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (response) => {
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      queryClient.setQueryData(['auth', 'user'], userData);
    },
  });
}
*/

//////

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (response: RegisterResponseDto) => {
      // Invalida una query fittizia o salva il messaggio nella cache se vuoi leggerlo dalla UI
      queryClient.setQueryData(['auth', 'registerMessage'], response.message);
    },
  });
}


/////

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      localStorage.removeItem('user');
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
  });
}

/////
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyEmailDto) => authApi.verifyEmail(data),
    onSuccess: (response: LoginResponseDto) => {
      // Salva l'utente e la sessione in localStorage
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      queryClient.setQueryData(['auth', 'user'], userData);
    },
  });
}
