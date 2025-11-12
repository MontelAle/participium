import { apiFetch } from "../client";
import { LoginDto, RegisterDto } from "@repo/api";
import { AuthResponse } from "@/types/auth";

export async function login(credentials: LoginDto): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function register(data: RegisterDto): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}