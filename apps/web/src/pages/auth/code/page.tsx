import CodeVerification from '@/components/auth/code';
import { useLocation, Navigate } from 'react-router-dom';

const CodePage = () => {
  const location = useLocation();
  const email = location.state?.email;

  // Se non c'è email, reindirizza al login
  if (!email) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md md:max-w-6xl">
        <CodeVerification email={email} />
      </div>
    </div>
  );
};

export default CodePage;
