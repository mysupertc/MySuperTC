import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AuthNav } from "@/components/auth-nav"
import { PublicFooter } from "@/components/public-footer"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 w-full items-center justify-center p-6 bg-clay-bg relative">
        <AuthNav />

        <div className="w-full max-w-sm">
          <Card className="clay-element">
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please check your email and click the confirmation link to activate your account before signing in.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm">
                <Link href="/landing" className="text-blue-600 hover:text-blue-800 font-medium">
                  Return to Home
                </Link>
                <span className="mx-2 text-gray-400">•</span>
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Go to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
