import { apiFetch } from "../client";
import { MunicipalityUser } from "../../types/users";

export async function getMunicipalityUsers(): Promise<MunicipalityUser[]> {
  return apiFetch<MunicipalityUser[]>("/administrator/municipalityUsers", {
    method: "GET",
  });
}

/*
export async function createMunicipalityUser(data: CreateMunicipalityUserDto): Promise<MunicipalityUser> {
  return apiFetch<MunicipalityUser>("/administrator/municipalityUsers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type CreateMunicipalityUserDto = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string; 
};
*/