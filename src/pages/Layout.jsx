

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, Users, Calendar, Settings, Building, User, LogOut, Moon, Sun, ChevronDown, MessageCircle } from "lucide-react";
import { User as UserEntity } from '@/api/entities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import FloatingChatWidget from '../components/chat/FloatingChatWidget';
import FloatingEmailWidget from '../components/email/FloatingEmailWidget';
import NotificationProvider from '../components/notifications/NotificationProvider';
import FloatingNotifications from '../components/notifications/FloatingNotifications';

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home
  },
  // Transactions is now a dropdown - removed from here
  {
    title: "CRM",
    url: createPageUrl("CRM"),
    icon: Users
  },
  {
    title: "Contacts",
    url: createPageUrl("Contacts"),
    icon: Users
  },
  {
    title: "Assistant",
    url: createPageUrl("Assistant"),
    icon: MessageCircle // New Assistant item
  },
  {
    title: "Calendar",
    url: createPageUrl("Calendar"),
    icon: Calendar
  }];

const PUBLIC_PAGES = ["Landing", "Resources", "CaliforniaDisclosures", "PreSaleInspection", "RetrofitInspections", "PrivacyPolicy", "TermsOfService"];


export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [floatingWidgetsOpen, setFloatingWidgetsOpen] = useState({ chat: false, email: false });

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        const userTheme = currentUser.theme || 'light';
        setTheme(userTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(userTheme);
      } catch (e) {
        // Not logged in or error fetching user, default to light theme
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('light');
        }
      }
    };
    fetchUser();
  }, [location.key]); // Refetch on navigation to update theme if changed
  
  const currentPageName = location.pathname.split('/').pop() || 'Landing';
  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);


  // Handle floating widget state
  const handleWidgetToggle = (widget, isOpen) => {
    setFloatingWidgetsOpen(prev => ({
      ...prev,
      [widget]: isOpen
    }));
  };

  const shouldShowFloatingWidget = (widget) => {
    // Don't show any floating widgets on public pages
    if (isPublicPage) return false;
    
    // If this widget is open, show it
    if (floatingWidgetsOpen[widget]) return true;
    
    // If any other widget is open, don't show this one
    const otherWidgetsOpen = Object.entries(floatingWidgetsOpen)
      .filter(([key]) => key !== widget)
      .some(([, isOpen]) => isOpen);
    
    return !otherWidgetsOpen;
  };

  return (
    <NotificationProvider>
      <style>
        {`
          :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f9fafb;
            --text-primary: #111827;
            --text-secondary: #374151;
            --text-muted: #6b7280;
            --border-color: #f3f4f6;
            --accent-blue: #2563eb;
            --accent-purple: #7c3aed;
            --accent-red: #dc2626;
            --accent-mint: #059669;
            --component-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --component-shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --card-radius: 16px;
            --button-radius: 8px;
          }
          
          .dark {
            --bg-primary: #030712;
            --bg-secondary: #1f2937;
            --text-primary: #f9fafb;
            --text-secondary: #d1d5db;
            --text-muted: #9ca3af;
            --border-color: #374151;
          }

          /* Global Font & Background */
          body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Typography */
          h1, h2, h3, h4, h5, h6 {
            color: var(--text-primary) !important;
            font-weight: 700 !important;
          }
          .text-gray-900 { color: var(--text-primary) !important; }
          .text-gray-800 { color: var(--text-primary) !important; }
          .text-gray-700 { color: var(--text-secondary) !important; }
          .text-gray-600 { color: var(--text-muted) !important; }
          .text-gray-500 { color: var(--text-muted) !important; }
          .text-gray-400 { color: var(--text-muted) !important; }

          /* Sticky Navigation */
          .header-main {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 40;
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
          }
          .dark .header-main {
            background-color: rgba(3, 7, 18, 0.8);
          }
          
          .main-content {
            padding-top: 80px;
          }

          /* Z-index hierarchy for floating components */
          .leaflet-container {
            z-index: 1 !important;
          }
          
          .leaflet-control-container {
            z-index: 2 !important;
          }
          
          /* Floating widgets - ensure proper layering */
          .floating-chat-widget {
            z-index: 100000 !important;
          }
          
          .floating-email-widget {
            z-index: 100001 !important;
          }

          /* Hide floating buttons when widgets are open */
          .floating-widget-hidden {
            display: none !important;
          }

          /* Tooltips are removed for cleaner design, but keeping for reference if needed */
          
          /* Main Element Style (replaces .clay-element) */
          .clay-element {
            background: var(--bg-primary);
            border-radius: var(--card-radius);
            border: 1px solid var(--border-color);
            box-shadow: var(--component-shadow);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .dark .clay-element {
            background: var(--bg-secondary);
          }
          .clay-element:hover {
            transform: translateY(-2px);
            box-shadow: var(--component-shadow-hover);
          }
          
          /* Button Overrides */
           button, .button-pill {
            border-radius: var(--button-radius) !important;
            border: 1px solid transparent;
            box-shadow: none;
            transition: all 0.2s ease;
            font-weight: 500;
          }
          button:hover, .button-pill:hover {
            transform: translateY(-1px);
          }
          button:active, .button-pill:active {
            transform: translateY(0);
          }
          
          /* Accent Color Buttons */
          .clay-accent-blue {
            background-color: var(--accent-blue) !important;
            color: white !important;
            border: none;
          }
           .clay-accent-mint {
            background-color: var(--accent-mint) !important;
            color: white !important;
            border: none;
          }
          
          .bg-white {
             background: var(--bg-primary) !important;
          }
          .bg-gray-50 {
             background: var(--bg-secondary) !important;
          }
          
          /* Glowing Badges/Pills are removed for cleaner design */

          /* Input Fields */
          input, textarea, select, .input-style, .select-trigger-style {
            background: var(--bg-secondary) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: var(--button-radius) !important;
            color: var(--text-primary) !important;
            box-shadow: none !important;
          }
           input:focus, textarea:focus, select:focus, .select-trigger-style[data-state=open] {
            border-color: var(--accent-blue) !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
          }
          input::placeholder, textarea::placeholder {
            color: var(--text-muted) !important;
          }

          /* Header & Navigation */
          .nav-link {
            padding: 6px 12px;
            border-radius: var(--button-radius);
            font-size: 14px;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.3s ease;
          }
          .nav-link:hover {
            color: var(--text-primary);
            background-color: var(--bg-secondary);
          }
          .nav-link-active {
            color: var(--text-primary) !important;
            background-color: var(--bg-secondary) !important;
            box-shadow: none;
          }

          /* Border Overrides */
          .border, .border-gray-200, .border-gray-100 {
            border-color: var(--border-color) !important;
          }
           .border-0 { border: none !important }
           .divide-gray-100 > * + * {
            border-color: var(--border-color) !important;
          }

          /* Drag and Drop Glow Effect */
          .border-indigo-400 {
            border-color: var(--accent-blue) !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
          }
          
          .bg-indigo-50 {
            background-color: #eef2ff !important;
          }

          /* General footer style */
          .main-footer {
            background-color: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
          }
          .dark .main-footer {
             background-color: #111827;
          }
        `}
      </style>
      
      <div className="min-h-screen flex flex-col w-full bg-primary">
        <header className="header-main">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20">
              <Link to={createPageUrl("Landing")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-900 dark:bg-white rounded-lg">
                  <div className="text-white dark:text-black font-bold text-lg tracking-tighter">
                    TC
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white">My Super TC</h2>
                </div>
              </Link>
              
              {!isPublicPage && user && (
                <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                  {navigationItems.map((item) =>
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`nav-link flex items-center gap-2 ${
                      location.pathname === item.url ?
                      'nav-link-active bg-white dark:bg-gray-900 shadow-sm' :
                      'hover:bg-gray-200 dark:hover:bg-gray-700'}`
                      }>

                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                  )}
                  {/* Transactions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`nav-link flex items-center gap-2 ${
                        location.pathname.includes(createPageUrl("Transactions")) || location.pathname.includes(createPageUrl("Pipeline"))
                          ? 'nav-link-active bg-white dark:bg-gray-900 shadow-sm' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                        <FileText className="w-4 h-4" />
                        Transactions
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 clay-element mt-2">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Transactions")} className="cursor-pointer">Active</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <Link to={createPageUrl("Pipeline")} className="cursor-pointer">Pipeline</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </nav>
              )}

              <div className="flex items-center gap-3">
                {isPublicPage && (
                   <div className="hidden md:flex items-center gap-6">
                      <Link to={createPageUrl("Resources")} className="text-sm font-medium text-gray-600 hover:text-gray-900">Resources</Link>
                      <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
                    </div>
                )}
                {user ? (
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {user?.profile_picture_url ?
                          <img src={user.profile_picture_url} alt={user.full_name || 'User'} className="h-full w-full object-cover" /> :

                          <span className="text-gray-700 font-semibold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                          }
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 clay-element mt-2" align="end" forceMount>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Profile")} className="flex items-center gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            <span>Edit Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Resources")} className="flex items-center gap-2 cursor-pointer">
                            <FileText className="w-4 h-4" />
                            <span>Resources</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => UserEntity.logout()} className="cursor-pointer">
                          <LogOut className="w-4 h-4 mr-2" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                  <Button onClick={() => UserEntity.login()} className="clay-accent-blue">Sign In</Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={`${!isPublicPage ? 'bg-zinc-50' : ''} flex-1 overflow-auto main-content`}>
          <div className={`${!isPublicPage ? 'container mx-auto px-6 py-8' : ''}`}>
            {children}
          </div>
        </main>
        
        <footer className="py-12 sm:py-16 px-4 sm:px-6 main-footer text-gray-500">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2 md:col-span-2">
                 <Link to={createPageUrl("Landing")} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-900 dark:bg-white rounded-lg">
                    <div className="text-white dark:text-black font-bold text-lg tracking-tighter">
                      TC
                    </div>
                  </div>
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white">My Super TC</h2>
                </Link>
                <p className="text-sm">The ultimate platform for real estate transaction management.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("Dashboard")} className="text-sm hover:text-gray-900">Dashboard</Link></li>
                  <li><Link to={createPageUrl("Transactions")} className="text-sm hover:text-gray-900">Transactions</Link></li>
                  <li><Link to={createPageUrl("CRM")} className="text-sm hover:text-gray-900">CRM</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("Resources")} className="text-sm hover:text-gray-900">Resource Hub</Link></li>
                  <li><a href="#" className="text-sm hover:text-gray-900">Blog</a></li>
                  <li><a href="#" className="text-sm hover:text-gray-900">Support</a></li>
                </ul>
              </div>
              
               <div>
                <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><Link to={createPageUrl("PrivacyPolicy")} className="text-sm hover:text-gray-900">Privacy Policy</Link></li>
                  <li><Link to={createPageUrl("TermsOfService")} className="text-sm hover:text-gray-900">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
               <p className="text-xs text-gray-500 mb-4 text-center max-w-4xl mx-auto">
                <strong>Notice:</strong> The material on this website is made available solely for informational purposes and does not constitute legal or real estate advice. No warranties or representations are made regarding the accuracy or completeness of the information. Laws, ordinances, and municipal requirements are subject to change without notice. Parties engaging in the purchase or sale of real property should consult licensed professionals and the applicable municipal authority to confirm requirements before proceeding with a transaction.
              </p>
              <p className="text-sm text-center text-gray-600 mt-8">&copy; {new Date().getFullYear()} MySuperTC. All rights reserved.</p>
            </div>
          </div>
        </footer>
        
        {/* Floating Notifications - Only show on authenticated pages */}
        {user && !isPublicPage && <FloatingNotifications />}
        
        {/* Floating Widgets - Only show on non-landing pages with proper visibility logic */}
        {shouldShowFloatingWidget('chat') && (
          <div className="floating-chat-widget">
            <FloatingChatWidget 
              onStateChange={(isOpen) => handleWidgetToggle('chat', isOpen)}
            />
          </div>
        )}
        {shouldShowFloatingWidget('email') && (
          <div className="floating-email-widget">
            <FloatingEmailWidget 
              onStateChange={(isOpen) => handleWidgetToggle('email', isOpen)}
            />
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}

