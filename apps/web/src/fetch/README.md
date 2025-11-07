# Fetch API Documentation

This folder contains all API client utilities and services for communicating with the backend.

## Structure

- `api-client.ts` - Base API client with fetch wrapper
- `auth.service.ts` - Authentication service (login, register, logout)
- `useAuth.ts` - React hook for authentication
- `types.ts` - TypeScript types for API requests/responses
- `index.ts` - Main export file

## Configuration

Create a `.env` file in `apps/web/` with:

```env
VITE_API_URL=http://localhost:3000
```

## Usage

### In Login Form

```tsx
import { useAuth } from '@/fetch';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const result = await login({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (result.success) {
      console.log('Login successful!', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### In Registration Form

```tsx
import { useAuth } from '@/fetch';

export function RegistrationForm() {
  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const result = await register({
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      firstName: formData.get('firstname') as string,
      lastName: formData.get('lastname') as string,
      password: formData.get('password') as string,
    });

    if (result.success) {
      console.log('Registration successful!', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="username" type="text" required />
      <input name="firstname" type="text" required />
      <input name="lastname" type="text" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Sign Up'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

## Features

- ✅ Automatic cookie management (session_cookie)
- ✅ CORS credentials included
- ✅ TypeScript support
- ✅ Error handling
- ✅ Loading states
- ✅ Auto-redirect after login/register
- ✅ Session persistence check
