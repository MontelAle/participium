export const createLoginResponse = (
  roleName: 'admin' | 'user' | 'pr_officer' | 'tech_officer',
) => {
  const isMunicipal = roleName !== 'user';

  const roleMap = {
    admin: { id: 'role-admin', label: 'Admin' },
    user: { id: 'role-user', label: 'User' },
    pr_officer: { id: 'role-pr_officer', label: 'PR Officer' },
    tech_officer: { id: 'role-tech_officer', label: 'Technical Officer' },
  };

  const roleInfo = roleMap[roleName] || roleMap['user'];

  return {
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        user: {
          id: '123-uuid',
          username: `test-${roleName}`,
          email: `${roleName}@participium.com`,
          firstName: 'Test',
          lastName: 'User',
          roleId: roleInfo.id,
          role: {
            id: roleInfo.id,
            name: roleName,
            label: roleInfo.label,
            isMunicipal: isMunicipal,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          accessToken: 'fake-jwt-token-for-testing',
        },
      },
    }),
  };
};

export const createRegisterResponse = () => {
  return createLoginResponse('user');
};

export const mockRoles = [
  { id: 'role-admin', name: 'admin', label: 'Admin', isMunicipal: true },
  {
    id: 'role-pr_officer',
    name: 'pr_officer',
    label: 'PR Officer',
    isMunicipal: true,
  },
  {
    id: 'role-tech_officer',
    name: 'tech_officer',
    label: 'Technical Officer',
    isMunicipal: true,
  },
  {
    id: 'role-user',
    name: 'user',
    label: 'User',
    isMunicipal: false,
  },
];

export const mockOffices = [
  {
    id: 'maintenance',
    name: 'maintenance',
    label: 'Maintenance and Technical Services',
  },
  {
    id: 'infrastructure',
    name: 'infrastructure',
    label: 'Infrastructure',
  },
  {
    id: 'public_services',
    name: 'public_services',
    label: 'Local Public Services',
  },
  {
    id: 'environment',
    name: 'environment',
    label: 'Environment Quality',
  },
  {
    id: 'green_parks',
    name: 'green_parks',
    label: 'Green Areas and Parks',
  },
  {
    id: 'civic_services',
    name: 'civic_services',
    label: 'Decentralization and Civic Services',
  },
];

export const mockMunicipalityUsers = [
  {
    id: 'user-1',
    username: 'tech_infrastructure_1',
    email: 'tech.infra.1@participium.com',
    firstName: 'Giovanni',
    lastName: 'Bianchi',
    role: mockRoles[2],
    office: mockOffices[1],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    username: 'pr_officer_1',
    email: 'pr.officer.1@participium.com',
    firstName: 'Laura',
    lastName: 'Esposito',
    role: mockRoles[1],
    office: mockOffices[5],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    username: 'tech_green_parks_1',
    email: 'tech.parks.1@participium.com',
    firstName: 'Anna',
    lastName: 'Verdi',
    role: mockRoles[2],
    office: mockOffices[4],
    createdAt: new Date().toISOString(),
  },
];

export const createMutationResponse = (data: any) => ({
  status: 201,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data }),
});
