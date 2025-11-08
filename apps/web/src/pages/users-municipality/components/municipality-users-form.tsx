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
import { useState } from 'react';
import type { CreateMunicipalityUserDto, Role, User } from '@repo/api';

interface CreateMunicipalityUserFormProps {
  onSubmit: (data: CreateMunicipalityUserDto) => Promise<User>;
  onCancel?: () => void;
  roles: Role[];
}

export function MunicipalityUserForm({
  onSubmit,
  onCancel,
  roles,
}: CreateMunicipalityUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<CreateMunicipalityUserDto>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    password: '',
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
      await onSubmit(form);
      toast.success('Municipality user created successfully!');
      setForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        password: '',
      });
      onCancel?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create user';
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
            {roles
              .filter(
                (role) => role.name === 'admin' || role.name === 'moderator',
              )
              .map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput
            type="password"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
          />
          <InputGroupAddon>
            <LockIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </Button>

      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}
