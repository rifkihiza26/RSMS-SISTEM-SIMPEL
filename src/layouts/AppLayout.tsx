import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, ShoppingCart, ListOrdered, Wallet, Receipt,
  Package, PenTool, Box, RefreshCw, Users, FileText, Settings,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react'

type NavItem = { name: string; href: string; icon: React.ElementType; roles: ('ADMIN' | 'KASIR' | 'OWNER')[] }

const navItems: NavItem[] = [
  { name: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard, roles: ['ADMIN', 'KASIR', 'OWNER'] },
  { name: 'Kasir',       href: '/cashier',      icon: ShoppingCart,    roles: ['KASIR'] },
  { name: 'Transaksi',   href: '/transactions', icon: ListOrdered,     roles: ['ADMIN', 'KASIR'] },
  { name: 'Pemasukan',   href: '/income',       icon: Wallet,          roles: ['ADMIN', 'OWNER'] },
  { name: 'Pengeluaran', href: '/expenses',     icon: Receipt,         roles: ['ADMIN', 'OWNER'] },
  { name: 'Laporan',     href: '/reports',      icon: FileText,        roles: ['OWNER'] },
  { name: 'Produk',      href: '/products',     icon: Package,         roles: ['ADMIN'] },
  { name: 'Jasa',        href: '/services',     icon: PenTool,         roles: ['ADMIN'] },
  { name: 'Stok',        href: '/inventory',    icon: Box,             roles: ['ADMIN'] },
  { name: 'Restock',     href: '/restocks',     icon: RefreshCw,       roles: ['ADMIN'] },
  { name: 'Mekanik',     href: '/mechanics',    icon: Users,           roles: ['ADMIN'] },
  { name: 'Pengaturan',  href: '/settings',     icon: Settings,        roles: ['ADMIN'] },
]

export function AppLayout() {
  const { user, profile, loading, signOut, isAdmin, isOwner } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = routerState.location.pathname

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' })
    }
  }, [user, loading, navigate])

  if (pathname === '/login') {
    return <Outlet />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  const currentRole = profile?.role ?? 'KASIR'
  const roleBadgeClass = isAdmin
    ? 'bg-blue-100 text-blue-700'
    : isOwner
    ? 'bg-purple-100 text-purple-700'
    : 'bg-zinc-800 text-zinc-300'
  const roleBadgeLabel = isAdmin ? 'ADMIN' : isOwner ? 'OWNER' : 'KASIR'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-zinc-800 border-b">
        <img src="/logo.png" alt="RSMS Logo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-100 leading-tight truncate">Rakyat Sinting</p>
          <p className="text-xs text-zinc-400 truncate">Matic Shop</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(item => {
          // Tampilkan menu hanya jika role cocok
          if (!item.roles.includes(currentRole as any)) return null

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                isActive
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span className="truncate">{item.name}</span>
              {isActive && <ChevronRight className="h-3 w-3 ml-auto text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-100 truncate">{profile?.full_name || 'Pengguna'}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleBadgeClass}`}>{roleBadgeLabel}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-56 xl:w-64 flex-shrink-0 flex-col border-r bg-zinc-950 fixed inset-y-0 left-0 border-zinc-800 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 sm:pl-56 xl:pl-64 min-w-0">
        {/* Mobile topbar */}
        <header className="sm:hidden sticky top-0 z-30 flex items-center gap-3 bg-zinc-950 text-zinc-100 border-zinc-800 border-b px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-semibold text-sm">RSMS</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
