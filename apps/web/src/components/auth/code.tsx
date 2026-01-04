import { useForm, SubmitHandler } from "react-hook-form";
import { useRef } from "react";
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type FormValues = {
  code: string[];
};

interface CodeVerificationProps {
  email: string;
}

export default function CodeVerification({ email }: CodeVerificationProps) {
  const { verifyEmail, isLoading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { code: Array(6).fill("") },
  });

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const codeValues = watch("code");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const finalCode = data.code.join("");
    
    const result = await verifyEmail({
      email,
      code: finalCode,
    });

    if (result.success) {
      toast.success('Email verified successfully! Welcome!');
      if (result.data?.role.name === 'user') {
        navigate('/reports/map');
      } 
    } else {
      toast.error(result.error || 'Invalid verification code. Please try again.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (!/^[a-zA-Z0-9]?$/.test(value)) return;
    setValue(`code.${index}`, value);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !codeValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen items-center justify-center">
      <Card className="overflow-hidden p-0 h-auto md:h-[800px] w-full">
        <CardContent className="grid md:grid-cols-2 p-0 h-full">
          
          <div className="p-8 md:p-14 flex flex-col justify-center items-center mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold whitespace-nowrap mb-4">
                Enter your verification code
            </h2>
            <p className="text-muted-foreground text-lg text-center mb-4">
                We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>.
                Please enter it below to complete your registration.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="flex justify-center gap-4 mb-4">
                {[...Array(6)].map((_, index) => {
                  const { ref, ...rest } = register(`code.${index}`, { required: true });
                  return (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      {...rest}
                      ref={(el) => {
                        ref(el);
                        inputsRef.current[index] = el;
                      }}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-14 text-2xl text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  );
                })}
              </div>

              <Button type="submit" className="h-12 text-lg w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>

            </form>
          </div>

          <div className="bg-muted relative hidden md:flex items-center justify-center overflow-hidden h-full">
            <img
              src="/login_register.png"
              alt="Verification Illustration"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
