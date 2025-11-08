import { apiFetch } from "../client";
import { Role } from "../../types/roles";

export async function getMunicipalityUsers(): Promise<Role[]> {
  return apiFetch<Role[]>("/administrator/municipalityUsers", {
    method: "GET",
  });
}