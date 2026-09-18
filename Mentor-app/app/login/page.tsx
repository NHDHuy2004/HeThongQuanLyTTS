import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import LoginForm from './login-form'

async function LoginGuard() {
  const { user, profile } = await getSession()
  if (user && profile) {
    if (profile.role === 'mentor') redirect('/mentor-app/home')
    redirect(`/${profile.role}`)
  }
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginGuard />
    </Suspense>
  )
}
