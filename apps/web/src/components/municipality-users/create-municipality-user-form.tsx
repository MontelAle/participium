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
import { useCreateMunicipalityUser } from '@/hooks/use-municipality-users';
import { useOffices } from '@/hooks/use-offices';
import { useRoles } from '@/hooks/use-roles';
import { prettifyRole } from '@/lib/utils';
import type { CreateMunicipalityUserDto } from '@repo/api';
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

export function CreateMunicipalityUserForm() {
  const navigate = useNavigate();
  const { mutateAsync: createMunicipalityUser } = useCreateMunicipalityUser();
  const { data: roles = [] } = useRoles();
  const { data: offices = [] } = useOffices();

  const emptyForm: CreateMunicipalityUserDto = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    officeId: '',
    password: '',
  };
  const [form, setForm] = useState<CreateMunicipalityUserDto>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, roleId: value });
  };

  const handleOfficeChange = (value: string) => {
    setForm({ ...form, officeId: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      await createMunicipalityUser(form);
      toast.success('Municipality user created successfully!');
      setForm(emptyForm);
      navigate(-1);
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-none bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col h-full p-6 gap-8"
      >
        <div>
          <h2 className="text-2xl font-bold mb-2">Create Municipality User</h2>
          <p className="text-base text-muted-foreground mb-6">
            Enter the details below to create a new account.
          </p>
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
                  <SelectTrigger className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3">
                    <SelectValue placeholder="Select Office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
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
          </div>
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
            disabled={isLoading || !form.roleId || !form.officeId}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
