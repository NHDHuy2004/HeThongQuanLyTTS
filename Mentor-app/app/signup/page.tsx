import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import SignUpForm from './signup-form'

export default async function SignUpPage() {
  const { user, profile } = await getSession()
  if (user && profile) {
    if (profile.role === 'mentor') redirect('/mentor-app/home')
    redirect(`/${profile.role}`)
  }
  return <SignUpForm />
}