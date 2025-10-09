import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, Users, Calendar, Settings, User, LogOut, ChevronDown, MessageCircle } from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import FloatingEmailWidget from "@/components/email/FloatingEmailWidget";
import NotificationProvider from "@/components/notifications/NotificationProvider";
import FloatingNotifications from "@/components/notifications/FloatingNotifications";

import "@/styles/Layout.css"; // ✅ our extracted CSS

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "CRM", url: createPageUrl("CRM"), icon: Users },
  { title: "Contacts", url: createPageUrl("Contacts"), icon: Users },
  { title: "Assistant", url: createPageUrl("Assistant"), icon: MessageCircle },
  { title: "Calendar", url: createPageUrl("Calendar"), icon: Calendar }
];

const PUBLIC_PAGES = ["Landing", "Resources", "CaliforniaDisclosures", "PreSaleInspection", "RetrofitInspections", "PrivacyPolicy", "TermsOfService"];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  const currentPageName = location.pathname.split("/").pop() || "Landing";
  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [location.key]);

  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col w-full bg-primary">
        {/* HEADER */}
        <header className="header-main">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20">
              <Link to={createPageUrl("Landing")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-900 dark:bg-white rounded-lg">
                  <div className="text-white dark:text-black font-bold text-lg">TC</div>
                </div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">My Super TC</h2>
              </Link>

              <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`nav-link flex items-center gap-2 ${
                      location.pathname === item.url
                        ? "nav-link-active bg-white dark:bg-gray-900 shadow-sm"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}

                {/* Transactions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`nav-link flex items-center gap-2 ${
                        location.pathname.includes(createPageUrl("Transactions")) ||
                        location.pathname.includes(createPageUrl("Pipeline"))
                          ? "nav-link-active bg-white dark:bg-gray-900 shadow-sm"
                          : "hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Transactions
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 clay-element mt-2">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Transactions")}>Active</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Pipeline")}>Pipeline</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              <div className="flex items-center gap-3">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {user?.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt={user.full_name || "User"} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-700 font-semibold text-sm">
                              {user?.full_name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 clay-element mt-2" align="end" forceMount>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")}>Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")}>Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => UserEntity.logout()}>Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button onClick={() => UserEntity.login()} className="clay-accent-blue">Sign In</Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 main-content">{children}</main>

        {/* FOOTER (always visible) */}
        <footer className="py-12 sm:py-16 px-4 sm:px-6 main-footer text-gray-500">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2">
                <Link to={createPageUrl("Landing")} className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                    <div className="text-white dark:text-black font-bold text-lg">TC</div>
                  </div>
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white">My Super TC</h2>
                </Link>
                <p className="text-sm">The ultimate platform for real estate transaction management.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("Dashboard")}>Dashboard</Link></li>
                  <li><Link to={createPageUrl("Transactions")}>Transactions</Link></li>
                  <li><Link to={createPageUrl("CRM")}>CRM</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("Resources")}>Resource Hub</Link></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("PrivacyPolicy")}>Privacy Policy</Link></li>
                  <li><Link to={createPageUrl("TermsOfService")}>Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t mt-12 pt-8 text-center text-sm">
              &copy; {new Date().getFullYear()} MySuperTC. All rights reserved.
            </div>
          </div>
        </footer>

        {/* Floating notifications/widgets */}
        {user && <FloatingNotifications />}
        {user && <FloatingChatWidget />}
        {user && <FloatingEmailWidget />}
      </div>
    </NotificationProvider>
  );
}