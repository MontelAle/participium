import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Link } from "react-router-dom"
import { MailIcon, UserIcon, LockIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function RegistrationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await register({
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      firstName: formData.get('firstname') as string,
      lastName: formData.get('lastname') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Sign up to get started with Participium
                </p>
              </div>
              <Field>

                <InputGroup>
                  <InputGroupInput
                    id="email"
                    name="email"
                    type="email"
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
                  <InputGroupInput
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    required
                  />
                  <InputGroupAddon>
                    <UserIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>

                <InputGroup>
                  <InputGroupInput
                    id="firstname"
                    name="firstname"
                    type="text"
                    placeholder="Your First Name"
                    required
                  />
                  <InputGroupAddon>
                    <UserIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>

                <InputGroup>
                  <InputGroupInput
                    id="lastname"
                    name="lastname"
                    type="text"
                    placeholder="Your Last Name"
                    required
                  />
                  <InputGroupAddon>
                    <UserIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>

                <InputGroup>
                  <InputGroupInput 
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required 
                  />
                  <InputGroupAddon>
                    <LockIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Sign up'}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              <FieldDescription className="text-center">
                Already have an account? <Link to="/login">Sign in</Link>
              </FieldDescription>
              </FieldSeparator>
              <Field className="grid grid-cols-3 gap-4">
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:flex items-center justify-center overflow-hidden">
            <img
              src="images/participium-logo.svg"
              alt="Participium Logo"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
