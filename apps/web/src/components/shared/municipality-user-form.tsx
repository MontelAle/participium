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
  UserIcon,
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

type FormData = CreateMunicipalityUserDto;

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
          officeId: user.office?.id ?? '',
          password: '',
        }
      : {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          roleId: '',
          officeId: '',
          password: '',
        };

  const [form, setForm] = useState<FormData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, roleId: value, officeId: '' });
  };

  const handleOfficeChange = (value: string) => {
    setForm({ ...form, officeId: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (mode === 'create') {
        await createMunicipalityUser(form);
        toast.success('Municipality user created successfully!');
      } else {
        const updateData: UpdateMunicipalityUserDto = {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          roleId: form.roleId,
          officeId: form.officeId,
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

  function getAvailableOffices() {
    switch (selectedRoleName) {
      case 'external_maintainer':
        return offices.filter((office) => office.isExternal);
      case 'pr_officer':
        return offices.filter(
          (office) => office.name === 'organization_office',
        );
      case 'tech_officer':
        return offices.filter(
          (office) =>
            !office.isExternal && office.name !== 'organization_office',
        );
      default:
        return [];
    }
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
            <Field>
              <FieldLabel>Office</FieldLabel>
              <InputGroup className="h-12">
                <Select
                  value={form.officeId}
                  onValueChange={handleOfficeChange}
                >
                  <SelectTrigger
                    disabled={!form.roleId}
                    className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3"
                  >
                    <SelectValue placeholder="Select Office" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableOffices().map((office) => (
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

            {selectedRoleName === 'external_maintainer' && form.officeId && (
              <Field className="md:col-span-2">
                <FieldLabel>Categories for this Office</FieldLabel>
                  <InputGroup className="h-12">
                    <InputGroupInput
                      readOnly
                      value={
                        (() => {
                          const selectedOffice = offices.find(o => o.id === form.officeId);

                          if (!selectedOffice) return '';

                          if (selectedOffice.isExternal) {
                          return categories.filter(c => c.externalOffice?.id === selectedOffice.id).map(c => c.name).join(', ');
                          }

                          return selectedOffice.categories?.map(c => c.name).join(', ') ?? '';
                        })()
                      }
                      className="text-base bg-gray-100 cursor-not-allowed"
                    />
                  </InputGroup>
              </Field>
           )}

          </div>
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
              !form.officeId ||
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
