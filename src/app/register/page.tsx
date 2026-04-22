import { redirect } from 'next/navigation'

// Registration is merged into the LINE login flow — first-time LINE users are
// auto-created by /api/auth/line. This route is kept only so old bookmarks /
// rich-menu buttons pointing to /register still work.
export default function RegisterPage() {
  redirect('/line-login')
}
