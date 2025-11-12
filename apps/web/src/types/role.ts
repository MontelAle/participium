import { Role } from "@repo/api";

export type RoleResponse = {
    success: boolean;
    data: Role[];
};