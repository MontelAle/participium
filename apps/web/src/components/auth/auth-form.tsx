import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Link, useNavigate } from 'react-router-dom';
import { MailIcon, UserIcon, LockIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { AuthFormProps } from '@/types/ui';

export function AuthForm({ mode, className, ...props }: AuthFormProps) {
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (isLogin) {
      const result = await login({
        username: formData.get('username') as string,
        password: formData.get('password') as string,
      });
      if (result.success) {
        toast.success('Login successful! Welcome back!');
        if (result.data?.role.name === 'user') {
          navigate('/report-map');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        toast.error(result.error || 'Invalid credentials. Please try again.');
      }
    } else {
      const result = await register({
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        firstName: formData.get('firstname') as string,
        lastName: formData.get('lastname') as string,
        password: formData.get('password') as string,
      });
      if (result.success) {
        toast.success('Registration successful! Welcome!');
        navigate('/report-map');
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 h-auto md:h-[800px]">
        <CardContent className="grid p-0 md:grid-cols-2 h-full">
          <div
            className={cn(
              'p-8 md:p-14 overflow-y-auto',
              isLogin && 'flex items-center',
            )}
          >
            <form className="w-full" onSubmit={handleSubmit}>
              <FieldGroup className="gap-6">
                <div className="flex flex-col items-center gap-2 text-center mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                  </h1>
                  <p className="text-muted-foreground text-lg text-balance">
                    {isLogin
                      ? 'Login to your Participium account'
                      : 'Sign up to get started with Participium'}
                  </p>
                </div>
                <Field>
                  <InputGroup>
                    <InputGroupInput
                      id="username"
                      name="username"
                      type="username"
                      placeholder="Username"
                      className="h-12 text-lg"
                      required
                    />
                    <InputGroupAddon>
                      <UserIcon className="size-6" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                {!isLogin && (
                  <>
                    <Field>
                      <InputGroup>
                        <InputGroupInput
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Email"
                          className="h-12 text-lg"
                          required
                        />
                        <InputGroupAddon>
                          <MailIcon className="size-6" />
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
                          className="h-12 text-lg"
                          required
                        />
                        <InputGroupAddon>
                          <UserIcon className="size-6" />
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
                          className="h-12 text-lg"
                          required
                        />
                        <InputGroupAddon>
                          <UserIcon className="size-6" />
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </>
                )}

                <Field>
                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="h-12 text-lg"
                      required
                    />
                    <InputGroupAddon>
                      <LockIcon className="size-6" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 text-lg w-full"
                  >
                    {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Sign up'}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-4">
                  <FieldDescription className="text-center text-base">
                    {isLogin ? (
                      <>
                        Don't have an account?{' '}
                        <Link
                          to="/auth/register"
                          className="font-medium hover:underline"
                        >
                          Sign up
                        </Link>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <Link
                          to="/auth/login"
                          className="font-medium hover:underline"
                        >
                          Sign in
                        </Link>
                      </>
                    )}
                  </FieldDescription>
                </FieldSeparator>
              </FieldGroup>
            </form>
          </div>

          <div className="bg-muted relative hidden md:flex items-center justify-center overflow-hidden h-full">
            <img
              src="/login_register.png"
              alt="Participium Logo"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
