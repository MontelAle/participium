import * as React from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { User, UpdateMunicipalityUserDto } from '@repo/api';
import {
  Pencil,
  XIcon,
  MailIcon,
  UserIcon,
  Briefcase,
  Building2,
} from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import { useOffices } from '@/hooks/use-offices';
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
import { prettifyRole } from '@/lib/utils';

export function EditMunicipalityUserDialog({ user }: { user: User }) {
  const { data: roles = [] } = useRoles();
  const { data: offices = [] } = useOffices();
  const { mutateAsync: updateMunicipalityUser } = useUpdateMunicipalityUser();

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialForm: UpdateMunicipalityUserDto = {
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    roleId: user.role?.id ?? '',
    officeId: user.office?.id ?? '',
  };

  const [form, setForm] = useState<UpdateMunicipalityUserDto>(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, roleId: value });
  };

  const handleOfficeChange = (value: string) => {
    setForm({ ...form, officeId: value });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      await updateMunicipalityUser({ userId: user.id, data: form });
      toast.success(`User updated successfully!`);
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
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-8 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Dialog.Title className="text-2xl font-bold tracking-tight">
                Edit User
              </Dialog.Title>
              <Dialog.Description className="text-base text-muted-foreground">
                Update user details and permissions.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:bg-muted hover:opacity-100">
                <XIcon className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field>
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
              <InputGroup className="h-12">
                <InputGroupInput
                  type="email"
                  name="email"
                  placeholder="Email"
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <InputGroup className="h-12">
                  <Select value={form.roleId} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.name !== 'admin')
                        .map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id}
                            className="text-base py-3"
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
                <InputGroup className="h-12">
                  <Select
                    value={form.officeId}
                    onValueChange={handleOfficeChange}
                  >
                    <SelectTrigger className="h-full w-full border-0 bg-transparent shadow-none focus:ring-0 text-base px-3">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map((office) => (
                        <SelectItem
                          key={office.id}
                          value={office.id}
                          className="text-base py-3"
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
            <div className="mt-4 flex gap-3 justify-end">
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="text-base px-6"
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="text-base px-8"
              >
                {isLoading ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
