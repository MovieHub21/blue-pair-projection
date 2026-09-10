import { getCurrentUser } from '../../../../lib/account'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser()
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <ProfileClient
        name={profile?.name || ''}
        email={profile?.email || user?.email || ''}
        phone={profile?.phone || ''}
      />
    </div>
  )
}
