import { AuthForm } from '@/components/auth/auth-form';

const LoginPage = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md md:max-w-6xl">
        <AuthForm mode="login" />
      </div>
    </div>
  );
};

export default LoginPage;
