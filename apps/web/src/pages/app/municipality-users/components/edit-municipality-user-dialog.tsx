import * as React from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { User, UpdateMunicipalityUserDto } from '@repo/api';
import { Pencil, XIcon, MailIcon, UserIcon } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import { useUpdateMunicipalityUser } from '@/hooks/use-municipality-users';
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
import { toast } from 'sonner';

export function EditMunicipalityUserDialog({ user }: { user: User }) {
  const { data: roles = [] } = useRoles();
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialForm: UpdateMunicipalityUserDto = {
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    roleId: user.role?.id ?? '',
  };

  const [form, setForm] = useState<UpdateMunicipalityUserDto>(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, roleId: value });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setIsLoading(false);
      setForm({
        username: user.username ?? '',
        email: user.email ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        roleId: user.role?.id ?? '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      await updateMunicipalityUser({ userId: user.id, data: form });
      toast.success(`User "${form.username}" updated successfully!`);
      setOpen(false);
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit user">
          <Pencil className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-lg shadow-lg z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">Edit User</Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="p-1 rounded hover:bg-black/5"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

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
              <Select value={form.roleId} onValueChange={handleRoleChange}>
                <SelectTrigger className="InputGroupInput">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.name !== 'admin')
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(
                            (w) =>
                              w.charAt(0).toUpperCase() +
                              w.slice(1).toLowerCase(),
                          )
                          .join(' ')}{' '}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading || !form.roleId}>
                {isLoading ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
