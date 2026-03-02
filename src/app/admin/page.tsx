import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Content moderation dashboard.',
}

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">Admin Dashboard</h1>
      <p className="text-slate-500">
        Moderation dashboard will be implemented in the Content Moderation feature.
      </p>
    </main>
  )
}
