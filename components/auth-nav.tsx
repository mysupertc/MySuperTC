import Link from "next/link"

export function AuthNav() {
  return (
    <nav className="absolute top-6 left-6 right-6 flex justify-between items-center">
      <a href="https://mysupertc.com" className="text-lg font-semibold hover:opacity-80 transition-opacity">
        MySuperTC
      </a>
      <div className="flex gap-2 clay-element rounded-full p-1">
        <a
          href="https://mysupertc.com"
          className="px-4 py-2 rounded-full hover:bg-accent transition-colors text-sm font-medium"
        >
          Home
        </a>
        <Link
          href="/auth/login"
          className="px-4 py-2 rounded-full hover:bg-accent transition-colors text-sm font-medium"
        >
          Login
        </Link>
        <Link
          href="/auth/sign-up"
          className="px-4 py-2 rounded-full hover:bg-accent transition-colors text-sm font-medium"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  )
}
