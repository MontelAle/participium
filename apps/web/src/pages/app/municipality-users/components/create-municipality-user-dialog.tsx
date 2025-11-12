import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MailIcon, UserIcon, LockIcon, XIcon } from 'lucide-react';
import { Field } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useRoles } from '@/hooks/use-roles';
import { useCreateMunicipalityUser } from '@/hooks/use-municipality-users';
import type { CreateMunicipalityUserDto } from '@repo/api';
import { useEffect } from 'react';

export function CreateMunicipalityUserDialog({
  openDialog,
}: {
  openDialog?: boolean;
}) {
  const { mutateAsync: createMunicipalityUser } = useCreateMunicipalityUser();
  const { data: roles = [] } = useRoles();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openDialog) setOpen(true);
  }, [openDialog]);

  const [isLoading, setIsLoading] = useState(false);
  const emptyForm: CreateMunicipalityUserDto = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    password: '',
  };
  const [form, setForm] = useState<CreateMunicipalityUserDto>(emptyForm);

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
      setForm(emptyForm);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      await createMunicipalityUser(form);
      toast.success('Municipality user created successfully!');
      setForm(emptyForm);
      setOpen(false);
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button>Add User</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-lg shadow-lg z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">
              Create Municipality User
            </Dialog.Title>
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
                  {roles.map((role) => (
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

            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>

              <Button type="submit" disabled={isLoading || !form.roleId}>
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
