import Link from "next/link"
import { PublicFooter } from "@/components/public-footer"

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">Introduction</h2>
              <p className="leading-relaxed">
                My Super TC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you use our real estate transaction management application (&quot;Platform&quot;). By using the
                Platform, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <hr className="my-8" />

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">Information We Collect</h2>
              <p className="leading-relaxed">
                We collect two types of information: (1) information you provide directly, and (2) information generated
                through your use of the Platform.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">Personal & Professional Information</h3>
              <ul className="list-disc list-outside pl-6">
                <li>Name, email address, and contact information</li>
                <li>Professional details (e.g., DRE number, brokerage affiliation)</li>
                <li>Transaction, client, and contact data you input into the Platform</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Gmail Integration Data</h3>
              <p className="leading-relaxed">If you connect your Gmail account, we may collect:</p>
              <ul className="list-disc list-outside pl-6">
                <li>Email metadata (headers, subjects, recipients)</li>
                <li>Email content for threads linked to your active transactions</li>
              </ul>
              <p className="leading-relaxed">
                This data is used exclusively to power the email integration features within your account and is not
                used for advertising or unrelated purposes.
              </p>
            </section>

            <hr className="my-8" />

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-10">Contact Us</h2>
              <p className="leading-relaxed">
                For questions about this Privacy Policy or our data practices, please contact:
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
