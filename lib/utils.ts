import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createPageUrl(pageName: string, params?: string): string {
  const routes: Record<string, string> = {
    Landing: "/landing",
    Dashboard: "/dashboard",
    CRM: "/crm",
    Contacts: "/contacts",
    Assistant: "/assistant",
    Calendar: "/calendar",
    Transactions: "/transactions",
    Pipeline: "/pipeline",
    NewTransaction: "/transactions/new",
    TransactionDetail: "/transactions",
    PrivacyPolicy: "/privacy-policy",
    TermsOfService: "/terms-of-service",
    Resources: "/resources",
    CaliforniaDisclosures: "/resources/california-disclosures",
    Profile: "/profile",
    Settings: "/settings",
  }

  const basePath = routes[pageName] || "/"

  if (params) {
    // Handle query params like "id=123"
    if (params.startsWith("id=")) {
      const id = params.split("=")[1]
      return `${basePath}/${id}`
    }
    return `${basePath}?${params}`
  }

  return basePath
}
