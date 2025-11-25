import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User, UpdateMunicipalityUserDto } from '@repo/api';
import { MailIcon, UserIcon, Briefcase, Building2 } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import { useOffices } from '@/hooks/use-offices';
import { useUpdateMunicipalityUser } from '@/hooks/use-municipality-users';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { toast } from 'sonner';
import { prettifyRole } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function EditMunicipalityUserForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const { data: roles = [] } = useRoles();
  const { data: offices = [] } = useOffices();
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();

  const initialForm: UpdateMunicipalityUserDto = {
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    roleId: user.role?.id ?? '',
    officeId: user.office?.id ?? '',
  };

  const [form, setForm] = useState<UpdateMunicipalityUserDto>(initialForm);
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
      await updateMunicipalityUser({ userId: user.id, data: form });
      toast.success(`User updated successfully!`);
      navigate(-1);
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to update user';
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
          <h2 className="text-2xl font-bold mb-2">Edit Municipality User</h2>
          <p className="text-base text-muted-foreground mb-6">
            Update user details and permissions.
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
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
