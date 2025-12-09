import { ProfileForm } from '@/components/profile/profile-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, updateProfile } = useProfile();
  const { user } = useAuth();

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
              My Profile
            </h1>
          </div>
        </div>
        <ProfileForm
          profile={profile}
          user={user || undefined}
          updateProfile={updateProfile}
        />
      </div>
    </div>
  );
}
