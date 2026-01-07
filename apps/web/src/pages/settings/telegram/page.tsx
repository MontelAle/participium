import { linkTelegramAccount } from '@/api/endpoints/profile';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TelegramSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnTo = encodeURIComponent(location.pathname);
      navigate(`/auth/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      await linkTelegramAccount(code);
      toast.success('Telegram account linked successfully!');
      setCode('');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to link account';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1 shrink-0">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="group pl-0 h-8 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
          </div>
          <div className="flex items-center pb-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Link Telegram Account
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Telegram Account Linking</CardTitle>
            <CardDescription>
              Enter the 6-digit code from the Telegram bot to link your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-foreground"
                >
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setCode(value);
                    }
                  }}
                  maxLength={6}
                  disabled={isLoading}
                  className="text-lg tracking-widest text-center font-mono"
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Get your code by sending /link to the Participium bot on
                  Telegram
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full"
                >
                  {isLoading ? 'Linking...' : 'Link Account'}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium mb-2">How to get a code:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Telegram and search for @participium_torino_bot</li>
                <li>Start and send the command /link to the bot</li>
                <li>Copy the 6-digit code from the bot's response</li>
                <li>Enter the code above within 15 minutes</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
