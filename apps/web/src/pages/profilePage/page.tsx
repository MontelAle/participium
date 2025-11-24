import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { User, Mail, Image as ImageIcon, Send } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

type FormValues = {
  telegramUsername?: string;
  emailNotificationsEnabled: boolean;
  profilePicture?: File | null;
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { data: me, updateProfile } = useProfile(authUser?.id || '');
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Populate form with user data when loaded
  useEffect(() => {
    if (me) {
      reset({
        telegramUsername: me.telegramUsername ?? '',
        emailNotificationsEnabled: !!me.emailNotificationsEnabled,
        profilePicture: null,
      });
      setPreviewUrl(me.profilePictureUrl ?? null);
    }
  }, [me, reset]);

  // Show preview for selected photo
  const watchedPhoto = watch('profilePicture');
  useEffect(() => {
    if (watchedPhoto instanceof File) {
      const url = URL.createObjectURL(watchedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!watchedPhoto && me?.profilePictureUrl)
      setPreviewUrl(me.profilePictureUrl);
  }, [watchedPhoto, me]);

  const validateFile = (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) return 'Only PNG/JPG allowed';
    if (file.size > 2_000_000) return 'Max file size is 2MB';
    return null;
  };

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      if (data.profilePicture) {
        const validation = validateFile(data.profilePicture);
        if (validation) {
          setServerError(validation);
          return;
        }
      }

      // Prepare FormData for API
      const formData = new FormData();
      formData.append('telegramUsername', data.telegramUsername ?? '');
      formData.append(
        'emailNotificationsEnabled',
        String(!!data.emailNotificationsEnabled),
      );
      if (data.profilePicture)
        formData.append('profilePicture', data.profilePicture);

      // Call mutation
      const updated = await updateProfile(formData);
      setSuccessMessage('Profile updated');
      // Optionally update preview with new image URL
      setPreviewUrl(updated?.data?.profilePictureUrl ?? previewUrl);
    } catch (err: any) {
      setServerError(err?.message ?? 'Update failed');
    }
  };

  if (!me)
    return (
      <div className="flex items-center justify-center h-full">
        <span>Loading profile...</span>
      </div>
    );

  return (
    <div className="w-full max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-foreground">My Profile</h1>
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Account Info</h2>
        <div className="grid grid-cols-2 gap-4 text-base">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>Email:</span>
            <strong>{me?.email}</strong>
          </div>
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span>Username:</span>
            <strong>{me?.username}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span>Name:</span>
            <strong>
              {me?.firstName} {me?.lastName}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span>Role:</span>
            <strong>{me?.role?.name ?? me?.roleId}</strong>
          </div>
        </div>
      </Card>

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

          {serverError && (
            <div className="text-red-600 text-sm">{serverError}</div>
          )}
          {successMessage && (
            <div className="text-green-600 text-sm">{successMessage}</div>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="px-6 h-11 rounded-lg shadow">
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
