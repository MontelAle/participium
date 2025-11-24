import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useProfile from '../hooks/useProfile';

type FormValues = {
  telegramUsername?: string;
  emailNotifications: boolean;
  photo?: File | null;
};

export default function ProfilePage(): JSX.Element {
  const { fetchProfile, updateProfile, uploadImage } = useProfile();
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { emailNotifications: false, telegramUsername: '' },
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await fetchProfile();
        setUser(me);
        if (me) {
          setValue('telegramUsername', me.telegramUsername ?? '');
          setValue('emailNotifications', !!me.emailNotifications);
          setPreviewUrl(me.profilePictureUrl ?? null);
        }
      } catch (err: any) {
        setServerError(err?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfile, setValue]);

  const watchedPhoto = watch('photo');
  useEffect(() => {
    if (watchedPhoto instanceof File) {
      const url = URL.createObjectURL(watchedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!watchedPhoto && user?.profilePictureUrl) setPreviewUrl(user.profilePictureUrl);
  }, [watchedPhoto, user]);

  const validateFile = (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) return 'Only PNG/JPG allowed';
    if (file.size > 2_000_000) return 'Max file size is 2MB';
    return null;
  };

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setSuccessMessage(null);
    if (!user) {
      setServerError('User not loaded');
      return;
    }
    try {
      let profilePictureUrl = user.profilePictureUrl ?? null;
      if (data.photo) {
        const validation = validateFile(data.photo);
        if (validation) {
          setServerError(validation);
          return;
        }
        const uploadRes = await uploadImage(data.photo);
        profilePictureUrl = uploadRes?.url ?? uploadRes?.data?.url ?? uploadRes?.data ?? profilePictureUrl;
      }

      const payload = {
        telegramUsername: data.telegramUsername ?? null,
        emailNotifications: !!data.emailNotifications,
        profilePictureUrl,
      };

      const updated = await updateProfile(user.id, payload);
      setUser(updated);
      setSuccessMessage('Profile updated');
    } catch (err: any) {
      setServerError(err?.message ?? 'Update failed');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>My Profile</h1>

      <section style={{ marginBottom: 20 }}>
        <h2>Account Info</h2>
        <div>Email: <strong>{user?.email}</strong></div>
        <div>Username: <strong>{user?.username}</strong></div>
        <div>Name: <strong>{user?.firstName} {user?.lastName}</strong></div>
        <div>Role: <strong>{user?.role?.name ?? user?.roleId}</strong></div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
          <legend style={{ fontWeight: 600 }}>Edit profile</legend>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="profile preview"
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div style={{ width: 120, height: 120, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  No photo
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Profile picture</label>
              <Controller
                control={control}
                name="photo"
                render={({ field }) => (
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      field.onChange(f);
                    }}
                  />
                )}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>PNG/JPG up to 2MB. Preview shown above.</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Telegram username</label>
            <Controller
              control={control}
              name="telegramUsername"
              render={({ field }) => (
                <input {...field} placeholder="@telegram" style={{ width: '100%', padding: 8 }} />
              )}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Controller
              control={control}
              name="emailNotifications"
              render={({ field }) => (
                <label>
                  <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  {' '}Enable email notifications
                </label>
              )}
            />
          </div>

          {serverError && <div style={{ color: 'red', marginBottom: 12 }}>{serverError}</div>}
          {successMessage && <div style={{ color: 'green', marginBottom: 12 }}>{successMessage}</div>}

          <div>
            <button type="submit" style={{ padding: '8px 16px' }}>Save</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}