'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
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
import { MailIcon, UserIcon, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Role, User } from '@repo/api';
import type { UpdateMunicipalityUserDto } from '@repo/api';
import { useUpdateMunicipalityUser } from '@/hooks/use-municipality-users';

interface EditUserFormProps {
  user: User;
  roles: Role[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditUserForm({
  user,
  roles,
  onSuccess,
  onCancel,
}: EditUserFormProps) {
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<UpdateMunicipalityUserDto>({
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    role: user.role.name ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateMunicipalityUser({ userId: user.id, data: form });
      toast.success(`User "${form.username}" updated successfully!`);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <InputGroup>
          <InputGroupInput
            name="username"
            placeholder="Username"
            required
            value={form.username}
            onChange={handleChange}
          />
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput
            type="email"
            name="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={handleChange}
          />
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput
            name="firstName"
            placeholder="First Name"
            required
            value={form.firstName}
            onChange={handleChange}
          />
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput
            name="lastName"
            placeholder="Last Name"
            required
            value={form.lastName}
            onChange={handleChange}
          />
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <Select value={form.role} onValueChange={handleRoleChange} required>
          <SelectTrigger className="InputGroupInput">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Confirm'}
        </Button>
      </div>
    </form>
  );
}
