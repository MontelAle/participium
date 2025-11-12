import * as React from 'react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import type { User } from '@repo/api';
import { Pencil } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import type { UpdateMunicipalityUserDto } from '@repo/api';
import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { MailIcon, UserIcon } from 'lucide-react';
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
import { useUpdateMunicipalityUser } from '@/hooks/use-municipality-users';
import { toast } from 'sonner';

export function EditMunicipalityUserDialog({ user }: { user: User }) {
  const { data: roles = [] } = useRoles();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();

  const [form, setForm] = useState<UpdateMunicipalityUserDto>({
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    role: user.role ?? {},
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    const role = roles.find((r) => r.id === value);

    setForm({ ...form, role });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await updateMunicipalityUser({ userId: user.id, data: form });
      toast.success(`User "${form.username}" updated successfully!`);
    } catch (error: any) {
      const errorMessage = error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon">
          {/* Matita */}
          <Pencil className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-2">
            Edit User
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
                value={form.role?.name}
                onValueChange={handleRoleChange}
                required
              >
                <SelectTrigger className="InputGroupInput">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
