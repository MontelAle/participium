import * as authApi from '@/api/endpoints/auth';
import type { LoginDto, RegisterDto } from '@repo/api';
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
