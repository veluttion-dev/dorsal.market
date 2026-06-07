import { ProfilePage } from '@/features/users/components/profile-page.client';

export default function Page() {
  return (
    <main className="container mx-auto px-6 py-12">
      <ProfilePage completeMode />
    </main>
  );
}
