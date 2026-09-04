import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.28),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.2),transparent_38%)]" />
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </main>
  )
}