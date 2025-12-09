import { MunicipalityUserForm } from '@/components/shared/municipality-user-form';
import type { User } from '@repo/api';

export function EditMunicipalityUserForm({ user }: { user: User }) {
  return <MunicipalityUserForm mode="edit" user={user} />;
}
