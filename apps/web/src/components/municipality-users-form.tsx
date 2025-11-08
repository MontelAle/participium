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

interface CreateMunicipalityUserFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export function MunicipalityUserForm({
  onSubmit,
  onCancel,
}: CreateMunicipalityUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      role,
      password: formData.get('password') as string,
    };

    const result = await onSubmit(payload);
    setIsLoading(false);

    if (result.success) {
      toast.success('Municipality user created successfully!');
      e.currentTarget.reset();
    } else {
      toast.error(result.error || 'Failed to create user.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <InputGroup>
          <InputGroupInput name="username" placeholder="Username" required />
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
          />
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput name="firstName" placeholder="First Name" required />
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <InputGroup>
          <InputGroupInput name="lastName" placeholder="Last Name" required />
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger className="InputGroupInput">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
            {/* Replace with roles from db as needed */}
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
