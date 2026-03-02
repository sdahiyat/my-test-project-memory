import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed',
  description: 'Your personalized photo feed.',
}

export default function FeedPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">Your Feed</h1>
      <p className="text-slate-500">
        Feed will be implemented after the Social Graph feature is complete.
      </p>
    </main>
  )
}
