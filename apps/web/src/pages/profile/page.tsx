import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import {
  ArrowLeft,
  Image as ImageIcon,
  MailIcon,
  Send,
  UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type FormValues = {
  telegramUsername?: string;
  emailNotificationsEnabled: boolean;
  profilePicture?: File | null;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      emailNotificationsEnabled: true,
      telegramUsername: '',
      profilePicture: null,
      firstName: '',
      lastName: '',
      username: '',
      email: '',
    },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      reset({
        telegramUsername: profile.telegramUsername ?? '',
        emailNotificationsEnabled: !!profile.emailNotificationsEnabled,
        profilePicture: null,
        firstName: profile.user.firstName ?? '',
        lastName: profile.user.lastName ?? '',
        username: profile.user.username ?? '',
        email: profile.user.email ?? '',
      });
      setPreviewUrl(profile.profilePictureUrl ?? null);
    }
  }, [profile, user, reset]);

  const watchedPhoto = watch('profilePicture');
  useEffect(() => {
    if (watchedPhoto instanceof File) {
      const url = URL.createObjectURL(watchedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!watchedPhoto && profile?.profilePictureUrl)
      setPreviewUrl(profile.profilePictureUrl);
  }, [watchedPhoto, profile]);

  const validateFile = (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) return 'Only PNG/JPG allowed';
    if (file.size > 2_000_000) return 'Max file size is 2MB';
    return null;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.profilePicture) {
        const validation = validateFile(data.profilePicture);
        if (validation) {
          return;
        }
      }

      if (!data.firstName || !data.lastName || !data.username || !data.email) {
        toast.error('Please fill all required fields');
        return;
      }
      const formData = new FormData();
      formData.append('telegramUsername', data.telegramUsername ?? '');
      formData.append(
        'emailNotificationsEnabled',
        String(data.emailNotificationsEnabled),
      );

      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('username', data.username);
      formData.append('email', data.email);

      if (data.profilePicture)
        formData.append('profilePicture', data.profilePicture);

      const updated = await updateProfile(formData);
      setPreviewUrl(updated?.profilePictureUrl ?? previewUrl);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-3xl mx-auto flex flex-col h-full gap-4">
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

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-lg font-semibold mb-2">Edit Profile</h2>
              <div className="flex gap-6 items-start">
                <div>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="profile preview"
                      className="w-28 h-28 object-cover rounded-xl border"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 flex items-center justify-center rounded-xl border text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Field>
                    <FieldLabel className="mb-2">Profile picture</FieldLabel>
                    <InputGroup>
                      <Controller
                        control={control}
                        name="profilePicture"
                        render={({ field }) => (
                          <InputGroupInput
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              field.onChange(f);
                            }}
                            className="h-10"
                          />
                        )}
                      />
                      <InputGroupAddon>
                        <ImageIcon className="size-5 text-muted-foreground" />
                      </InputGroupAddon>
                    </InputGroup>
                    <div className="text-xs text-muted-foreground mt-2">
                      PNG/JPG up to 2MB. Preview shown above.
                    </div>
                  </Field>
                </div>
              </div>

              <div className="flex gap-6">
                <Field className="flex-1">
                  <FieldLabel className="mb-2">First Name</FieldLabel>
                  <InputGroup>
                    <Controller
                      control={control}
                      name="firstName"
                      render={({ field }) => (
                        <InputGroupInput
                          {...field}
                          placeholder="First name"
                          className="h-10"
                        />
                      )}
                    />
                    <InputGroupAddon>
                      <UserIcon className="size-5 text-muted-foreground" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field className="flex-1">
                  <FieldLabel className="mb-2">Last Name</FieldLabel>
                  <InputGroup>
                    <Controller
                      control={control}
                      name="lastName"
                      render={({ field }) => (
                        <InputGroupInput
                          {...field}
                          placeholder="Last name"
                          className="h-10"
                        />
                      )}
                    />
                    <InputGroupAddon>
                      <UserIcon className="size-5 text-muted-foreground" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>

              <Field className="flex-1">
                <FieldLabel className="mb-2">Username</FieldLabel>
                <InputGroup>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <InputGroupInput
                        {...field}
                        placeholder="Username"
                        className="h-10"
                      />
                    )}
                  />
                  <InputGroupAddon>
                    <UserIcon className="size-5 text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field className="flex-1">
                <FieldLabel className="mb-2">Email</FieldLabel>
                <InputGroup>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <InputGroupInput
                        {...field}
                        placeholder="Email"
                        className="h-10"
                      />
                    )}
                  />
                  <InputGroupAddon>
                    <MailIcon className="size-5 text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="mb-2">Telegram username</FieldLabel>
                <InputGroup>
                  <Controller
                    control={control}
                    name="telegramUsername"
                    render={({ field }) => (
                      <InputGroupInput
                        {...field}
                        placeholder="@telegram"
                        className="h-10"
                      />
                    )}
                  />
                  <InputGroupAddon>
                    <Send className="size-5 text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <Controller
                  control={control}
                  name="emailNotificationsEnabled"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="accent-primary size-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Enable email notifications
                      </span>
                    </label>
                  )}
                />
              </Field>

              <div className="flex justify-end">
                <Button type="submit" className="px-6 h-11 rounded-lg shadow">
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
