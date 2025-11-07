import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export function HomePage() {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted/40", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("h1", { className: "text-4xl font-bold", children: "Welcome to Participium" }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Button, { asChild: true, size: "lg", children: _jsx(Link, { to: "/login", children: "Login" }) }), _jsx(Button, { asChild: true, size: "lg", variant: "outline", children: _jsx(Link, { to: "/register", children: "Register" }) })] })] }) }));
}
