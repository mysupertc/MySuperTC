"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface NotificationContextType {
  emailUpdateTrigger: number
  triggerEmailRefresh: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [emailUpdateTrigger, setEmailUpdateTrigger] = useState(0)

  const triggerEmailRefresh = useCallback(() => {
    setEmailUpdateTrigger((prev) => prev + 1)
  }, [])

  return (
    <NotificationContext.Provider value={{ emailUpdateTrigger, triggerEmailRefresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
