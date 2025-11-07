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
import { Link, useNavigate } from "react-router-dom"
import { MailIcon, LockIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const result = await login({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (result.success) {
      toast.success("Login successful!");
      navigate("/");
    } else {
      toast.error(result.error || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Participium account
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
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Login'}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              <FieldDescription className="text-center">
                Don't have an account? <Link to="/register">Sign up</Link>
              </FieldDescription>
              </FieldSeparator>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:flex items-center justify-center overflow-hidden">
            <img
              src="/images/participium-logo.svg"
              alt="Participium Logo"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
