import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useProfile } from '@/hooks/use-profile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { Image as ImageIcon, Send, ArrowLeft } from 'lucide-react';
import { data, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type FormValues = {
  telegramUsername?: string;
  emailNotificationsEnabled: boolean;
  profilePicture?: File | null;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, updateProfile } = useProfile();
  const { control, handleSubmit, setValue, watch, reset } = useForm<FormValues>(
    {
      defaultValues: {
        emailNotificationsEnabled: false,
        telegramUsername: '',
        profilePicture: null,
      },
    },
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      reset({
        telegramUsername: profile.data.telegramUsername ?? '',
        emailNotificationsEnabled: !!profile.data.emailNotificationsEnabled,
        profilePicture: null,
      });
      setPreviewUrl(profile.data.profilePictureUrl ?? null);
    }
  }, [profile, reset]);

  const watchedPhoto = watch('profilePicture');
  useEffect(() => {
    if (watchedPhoto instanceof File) {
      const url = URL.createObjectURL(watchedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!watchedPhoto && profile?.data.profilePictureUrl)
      setPreviewUrl(profile.data.profilePictureUrl);
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

      const formData = new FormData();
      formData.append('telegramUsername', data.telegramUsername ?? '');
      formData.append(
        'emailNotificationsEnabled',
        String(data.emailNotificationsEnabled),
      );
      if (data.profilePicture)
        formData.append('profilePicture', data.profilePicture);

      const updated = await updateProfile(formData);
      setPreviewUrl(updated?.data?.profilePictureUrl ?? previewUrl);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="accent-primary"
                      />
                      Enable email notifications
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
