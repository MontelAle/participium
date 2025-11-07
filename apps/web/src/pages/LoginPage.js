import { jsx as _jsx } from "react/jsx-runtime";
import { LoginForm } from '@/components/login-form';
const LoginPage = () => {
    return (_jsx("div", { className: "bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10", children: _jsx("div", { className: "w-full max-w-sm md:max-w-4xl", children: _jsx(LoginForm, {}) }) }));
};
export default LoginPage;
