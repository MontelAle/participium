import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import {
  useCreateMunicipalityUser,
  useUpdateMunicipalityUser,
} from '@/hooks/use-municipality-users';
import { useOffices } from '@/hooks/use-offices';
import { useRoles } from '@/hooks/use-roles';
import { prettifyRole } from '@/lib/utils';
import type {
  CreateMunicipalityUserDto,
  UpdateMunicipalityUserDto,
  User,
} from '@/types';
import {
  Briefcase,
  Building2,
  LockIcon,
  MailIcon,
  Plus,
  UserIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type MunicipalityUserFormProps =
  | {
      mode: 'create';
      user?: never;
    }
  | {
      mode: 'edit';
      user: User;
    };

type CreateFormData = Omit<CreateMunicipalityUserDto, 'officeId'> & { officeIds: string[] };
type EditFormData = Omit<CreateMunicipalityUserDto, 'officeId'> & { officeIds: string[] };
type FormData = CreateFormData | EditFormData;

// Type guard to check if form is in edit mode
function isEditFormData(form: FormData): form is EditFormData {
  return 'officeIds' in form;
}

export function MunicipalityUserForm({
  mode,
  user,
}: MunicipalityUserFormProps) {
  const navigate = useNavigate();
  const { mutateAsync: createMunicipalityUser } = useCreateMunicipalityUser();
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();
  const { data: roles = [] } = useRoles();
  const { data: offices = [] } = useOffices();
  const { data: categories = [] } = useCategories();

  const initialForm: FormData =
    mode === 'edit'
      ? {
          username: user.username ?? '',
          email: user.email ?? '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          roleId: user.role?.id ?? '',
          officeIds: user.officeRoles && user.officeRoles.length > 0
            ? user.officeRoles.map(or => or.officeId)
            : (user.office?.id ? [user.office.id] : []),
          password: '',
        }
      : {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          roleId: '',
          officeIds: [],
          password: '',
        };

  const [form, setForm] = useState<FormData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [additionalOffices, setAdditionalOffices] = useState<string[]>(
    mode === 'edit' && user.officeRoles && user.officeRoles.length > 1
      ? user.officeRoles.slice(1).map(or => or.officeId)
      : []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, roleId: value, officeIds: [] } as FormData);
    setAdditionalOffices([]);
  };

  const handleOfficeChange = (value: string) => {
    const officeIds = form.officeIds || [];
    setForm({ ...form, officeIds: [value, ...officeIds.slice(1)] });
  };

  const handleAdditionalOfficeChange = (index: number, value: string) => {
    const newAdditional = [...additionalOffices];
    newAdditional[index] = value;
    setAdditionalOffices(newAdditional);
  };

  const addOffice = () => {
    setAdditionalOffices([...additionalOffices, '']);
  };

  const removeOffice = (index: number) => {
    setAdditionalOffices(additionalOffices.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const primaryOfficeId = form.officeIds[0] || '';
      const allOfficeIds = [
        primaryOfficeId,
        ...additionalOffices.filter((id) => id !== ''),
      ].filter((id) => id !== '');

      // Convert officeIds to officeRoleAssignments format
      const officeRoleAssignments = allOfficeIds.map(officeId => ({
        officeId,
        roleId: form.roleId,
      }));

      if (mode === 'create') {
        const createData: CreateMunicipalityUserDto = {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          roleId: form.roleId,
          officeRoleAssignments,
        };
        await createMunicipalityUser(createData);
        toast.success('Municipality user created successfully!');
      } else if (mode === 'edit') {
        const updateData: UpdateMunicipalityUserDto = {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          officeRoleAssignments,
        };
        await updateMunicipalityUser({ userId: user.id, data: updateData });
        toast.success('User updated successfully!');
      }
      navigate(-1);
    } catch (error: any) {
      const errorMessage =
        error?.message ??
        `Failed to ${mode === 'create' ? 'create' : 'update'} user`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    mode === 'create' ? 'Create Municipality User' : 'Edit Municipality User';
  const description =
    mode === 'create'
      ? 'Enter the details below to create a new account.'
      : 'Update user details and permissions.';
  const submitText = mode === 'create' ? 'Create User' : 'Save Changes';
  const loadingText = mode === 'create' ? 'Creating...' : 'Updating...';

  const selectedRoleName = roles.find((r) => r.id === form.roleId)?.name;

  // Helper to get the primary office ID
  const getPrimaryOfficeId = (): string | undefined => {
    return form.officeIds?.[0];
  };

  function getAvailableOffices(excludeOfficeIds: string[] = []) {
    let filtered: typeof offices = [];
    switch (selectedRoleName) {
      case 'external_maintainer':
        filtered = offices.filter((office) => office.isExternal);
        break;
      case 'pr_officer':
        filtered = offices.filter(
          (office) => office.name === 'organization_office',
        );
        break;
      case 'tech_officer':
        filtered = offices.filter(
          (office) =>
            !office.isExternal && office.name !== 'organization_office',
        );
        break;
      default:
        filtered = [];
    }
    
    // Filter out already selected offices to prevent duplicates
    return filtered.filter((office) => !excludeOfficeIds.includes(office.id));
  }

  return (
    <Card className="w-full h-full flex flex-col border-none bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col h-full p-6 gap-8"
      >
        <div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-base text-muted-foreground mb-6">{description}</p>
        </div>
        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  name="firstName"
                  placeholder="First Name"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="text-base"
                />
                <InputGroupAddon>
                  <UserIcon className="size-5" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  name="lastName"
                  placeholder="Last Name"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="text-base"
                />
                <InputGroupAddon>
                  <UserIcon className="size-5" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
          <Field>
            <FieldLabel>Username</FieldLabel>
            <InputGroup className="h-12">
              <InputGroupInput
                name="username"
                placeholder="Username"
                required
                value={form.username}
                onChange={handleChange}
                className="text-base"
              />
              <InputGroupAddon>
                <UserIcon className="size-5" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel>Email Address</FieldLabel>
            <InputGroup className="h-12">
              <InputGroupInput
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={form.email}
                onChange={handleChange}
                className="text-base"
              />
              <InputGroupAddon>
                <MailIcon className="size-5" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <InputGroup className="h-12">
                <Select value={form.roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((role) => role.name !== 'admin')
                      .map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                          className="text-base"
                        >
                          {prettifyRole(role.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <InputGroupAddon>
                  <Briefcase className="size-5" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Office</FieldLabel>
                <InputGroup className="h-12">
                  <Select
                    value={getPrimaryOfficeId()}
                    onValueChange={handleOfficeChange}
                  >
                    <SelectTrigger
                      disabled={!form.roleId}
                      className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3"
                    >
                      <SelectValue placeholder="Select Office" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableOffices(
                        mode === 'edit' ? additionalOffices : []
                      ).map((office) => (
                        <SelectItem
                          key={office.id}
                          value={office.id}
                          className="text-base"
                        >
                          {office.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputGroupAddon>
                    <Building2 className="size-5" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              {additionalOffices.map((officeId, index) => (
                <Field key={index}>
                  <FieldLabel>Additional Office</FieldLabel>
                  <div className="flex gap-2">
                    <InputGroup className="h-12 flex-1">
                      <Select
                        value={officeId}
                        onValueChange={(value) => handleAdditionalOfficeChange(index, value)}
                      >
                        <SelectTrigger
                          disabled={!form.roleId}
                          className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3"
                        >
                          <SelectValue placeholder="Select Office" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableOffices([
                            form.officeIds?.[0],
                            ...additionalOffices.filter((_, i) => i !== index),
                          ].filter((id): id is string => id !== undefined)).map((office) => (
                            <SelectItem
                              key={office.id}
                              value={office.id}
                              className="text-base"
                            >
                              {office.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <InputGroupAddon>
                        <Building2 className="size-5" />
                      </InputGroupAddon>
                    </InputGroup>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOffice(index)}
                      className="h-12 w-12 shrink-0"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                </Field>
              ))}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOffice}
                  disabled={!form.roleId}
                  className="h-10 px-4 gap-2"
                >
                  <Plus className="size-4" />
                  Add Office
                </Button>
              </div>
            </div>
          </div>

          {selectedRoleName === 'external_maintainer' && getPrimaryOfficeId() && (
            <Field>
              <FieldLabel>Categories for this Office</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      const officeId = getPrimaryOfficeId();
                      const selectedOffice = offices.find(
                        (o) => o.id === officeId,
                      );
                      if (!selectedOffice) return null;
                      const officeCategories = selectedOffice.isExternal? categories.filter((c) => c.externalOffice?.id === selectedOffice.id,)
                        : selectedOffice.categories ?? [];
                      if (officeCategories.length === 0) {
                        return (
                        <span className="text-sm text-muted-foreground italic">
                          No categories assigned
                        </span>
                        );
                      }
                      return officeCategories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-md
                            bg-gray-100 border border-gray-200
                            text-gray-700 text-sm font-medium"
                        >
                          {category.name}
                        </span>
                      ));
                    })()}
                  </div>
              </Field>
            )}

          {mode === 'create' && (
            <Field>
              <FieldLabel>Password</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="text-base"
                />
                <InputGroupAddon>
                  <LockIcon className="size-5" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-dashed">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-11 px-6 text-base hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
            disabled={
              isLoading ||
              !form.roleId ||
              !getPrimaryOfficeId() ||
              (mode === 'create' && !form.password)
            }
          >
            {isLoading ? loadingText : submitText}
          </Button>
        </div>
      </form>
    </Card>
  );
}
