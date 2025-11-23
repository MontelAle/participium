import { AuthForm } from '@/components/auth-form';

const RegistrationPage = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md md:max-w-6xl">
        <AuthForm mode="register" />
      </div>
    </div>
  );
};

export default RegistrationPage;
