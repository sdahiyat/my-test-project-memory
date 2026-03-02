import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your PhotoBuddy account settings.',
}

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">Settings</h1>
      <p className="text-slate-500">
        Account settings will be implemented across the Authentication, Profile,
        Subscription, and Privacy features.
      </p>
    </main>
  )
}
