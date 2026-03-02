import { Metadata } from 'next'

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `@${params.username}`,
    description: `View ${params.username}'s photo portfolio on PhotoBuddy.`,
  }
}

export default function UserProfilePage({ params }: Props) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">@{params.username}</h1>
      <p className="text-slate-500">
        User profile page will be implemented in the User Profiles feature.
      </p>
    </main>
  )
}
