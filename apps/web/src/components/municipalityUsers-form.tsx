import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { MailIcon, UserIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface CreateMunicipalityUserFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function MunicipalityUserForm({ onSubmit }: CreateMunicipalityUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: formData.get("role") as string,
      password: formData.get("password") as string,
    };

    const result = await onSubmit(payload);
    setIsLoading(false);

    if (result.success) {
      toast.success("Municipality user created successfully!");
      e.currentTarget.reset();
    } else {
      toast.error(result.error || "Failed to create user.");
    }
  };

  return (
    <Card className="p-6 w-full max-w-lg">
      <CardContent>
        <h2 className="text-2xl font-bold mb-4">Create Municipality User</h2>
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
              <InputGroupInput type="email" name="email" placeholder="Email" required />
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
            <select name="role" className="InputGroupInput" required>
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              {/*da sostituire con i ruoli nel db */}
            </select>
          </Field>

          <Field>
            <InputGroup>
              <InputGroupInput type="password" name="password" placeholder="Password" required />
              <InputGroupAddon>
                <LockIcon />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
