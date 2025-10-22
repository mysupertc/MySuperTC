import Link from "next/link"

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4 text-gray-900">MySuperTC</h4>
            <p className="text-sm text-gray-600">
              The complete transaction management platform for real estate professionals.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://mysupertc.com#features" className="hover:text-blue-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="https://mysupertc.com#pricing" className="hover:text-blue-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="https://mysupertc.com/resources" className="hover:text-blue-600 transition-colors">
                  Resources
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://mysupertc.com/privacy-policy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://mysupertc.com/terms-of-service" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://mysupertc.com/california-disclosures"
                  className="hover:text-blue-600 transition-colors"
                >
                  California Disclosures
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Contact</h4>
            <p className="text-sm text-gray-600 mb-2">support@mysupertc.com</p>
            <div className="flex gap-3 mt-4">
              <a href="https://mysupertc.com" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </a>
              <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          © {new Date().getFullYear()} MySuperTC. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
