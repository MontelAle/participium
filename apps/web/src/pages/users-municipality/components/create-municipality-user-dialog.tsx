import { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { CreateMunicipalityUserDto } from '@repo/api';
import { MailIcon, UserIcon, LockIcon } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import { toast } from 'sonner';

export function CreateMunicipalityUserDialog() {
  const { data: roles = [] } = useRoles();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<CreateMunicipalityUserDto>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: { id: '', name: '' },
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    const role = roles.find((r) => r.id === value) || { id: '', name: '' };

    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      toast.success('Municipality user created successfully!');
      setForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: { id: '', name: '' },
        password: '',
      });
    } catch (error: any) {
      const errorMessage = error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add User</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-lg shadow-lg z-50">
          <Dialog.Title className="text-xl font-bold mb-4">
            Create Municipality User
          </Dialog.Title>

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
              <Select
                value={form.role.name}
                onValueChange={handleRoleChange}
                required
              >
                <SelectTrigger className="InputGroupInput">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
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

            <Button type="button" variant="outline">
              Cancel
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
