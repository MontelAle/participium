export interface UpdateMunicipalityUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface CreateMunicipalityUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}
