import React from 'react';
import { RegistrationForm } from '@/components/registration-form';

const RegistrationPage = () => {
    return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <RegistrationForm />
      </div>
    </div>
  )
}

export default RegistrationPage;