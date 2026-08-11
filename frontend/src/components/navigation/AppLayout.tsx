/**
 * AppLayout — the outer shell of the application.
 * Contains the Sidebar navigation and the main content area.
 * Motion is used for the sidebar collapse transition.
 */
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Products',  to: '/products',  icon: LayoutGrid },
  { label: 'Cart',      to: '/cart',      icon: ShoppingCart },
  { label: 'Orders',    to: '/orders',    icon: ClipboardList },
  { label: 'Inventory', to: '/inventory', icon: Package },
  { label: 'Profile',   to: '/profile',   icon: User },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col border-r border-white/[0.06] bg-canvas-1 shrink-0 overflow-hidden"
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-text-1 whitespace-nowrap overflow-hidden"
              >
                ShopFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-violet/[0.15] text-violet-bright border border-violet/20'
                    : 'text-text-3 hover:text-text-1 hover:bg-white/[0.04]',
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0 w-[18px] h-[18px]" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-3 hover:text-text-1 hover:bg-white/[0.04] transition-all text-sm"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-canvas-1/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-violet-bright" />
            <span className="text-sm font-medium text-text-2">
              E-Commerce Order System
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-text-3 font-mono bg-canvas-2 px-2 py-1 rounded-md border border-white/[0.06]">
              v1.0.0
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
