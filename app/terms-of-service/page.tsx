import Link from "next/link"
import { PublicFooter } from "@/components/public-footer"

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <Link
            href="/landing"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8"
          >
            ← Back to Home
          </Link>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">1. Agreement to Terms</h2>
              <p className="leading-relaxed">
                By accessing or using the My Super TC platform (&quot;Service&quot;), you agree to be bound by these
                Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
                These Terms constitute a legally binding agreement between you and My Super TC.
              </p>
            </section>

            <hr className="my-8" />

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">2. Description of Service</h2>
              <p className="leading-relaxed">
                My Super TC is a real estate transaction management platform designed for licensed professionals and
                authorized parties involved in real estate transactions. The Service enables users to organize deals,
                manage client relationships, track deadlines, and handle communications and documentation.
              </p>
            </section>

            <hr className="my-8" />

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">Contact Information</h2>
              <p className="leading-relaxed">
                For questions regarding these Terms, please contact us at:
                <br />📧 support@mysupertc.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
