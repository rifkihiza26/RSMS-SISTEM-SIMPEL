const fs = require('fs');
let code = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf-8');

const oldNavItems = `const navItems: NavItem[] = [
  { name: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard, roles: ['ADMIN', 'KASIR', 'OWNER'] },
  { name: 'Kasir',       href: '/cashier',      icon: ShoppingCart,    roles: ['ADMIN', 'KASIR'] },
  { name: 'Rekapan',     href: '/recaps',       icon: ClipboardList,   roles: ['ADMIN', 'OWNER'] },
  { name: 'Transaksi',   href: '/transactions', icon: ListOrdered,     roles: ['ADMIN', 'KASIR'] },
  { name: 'Pemasukan',   href: '/income',       icon: Wallet,          roles: ['ADMIN'] },
  { name: 'Pengeluaran', href: '/expenses',     icon: Receipt,         roles: ['ADMIN'] },
  { name: 'Laporan',     href: '/reports',      icon: FileText,        roles: ['ADMIN'] },
  { name: 'Penggajian',  href: '/payroll',      icon: Banknote,        roles: ['ADMIN'] },
  { name: 'Produk',      href: '/products',     icon: Package,         roles: ['ADMIN'] },
  { name: 'Jasa',        href: '/services',     icon: PenTool,         roles: ['ADMIN'] },
  { name: 'Stok',        href: '/inventory',    icon: Box,             roles: ['ADMIN'] },
  { name: 'Restock',     href: '/restocks',     icon: RefreshCw,       roles: ['ADMIN'] },
  { name: 'Mekanik',     href: '/mechanics',    icon: Users,           roles: ['ADMIN'] },
  { name: 'Pengaturan',  href: '/settings',     icon: Settings,        roles: ['ADMIN'] },
]`;

const newNavItems = `const navItems: NavItem[] = [
  { name: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard, roles: ['ADMIN', 'KASIR', 'OWNER'] },
  { name: 'Kasir',       href: '/cashier',      icon: ShoppingCart,    roles: ['ADMIN', 'KASIR'] },
  { name: 'Rekapan',     href: '/recaps',       icon: ClipboardList,   roles: ['ADMIN', 'OWNER'] },
  { name: 'Laporan',     href: '/reports',      icon: FileText,        roles: ['ADMIN', 'OWNER'] },
  { name: 'Transaksi',   href: '/transactions', icon: ListOrdered,     roles: ['ADMIN', 'KASIR'] },
  { name: 'Pemasukan',   href: '/income',       icon: Wallet,          roles: ['ADMIN'] },
  { name: 'Pengeluaran', href: '/expenses',     icon: Receipt,         roles: ['ADMIN'] },
  { name: 'Penggajian',  href: '/payroll',      icon: Banknote,        roles: ['ADMIN'] },
  { name: 'Produk',      href: '/products',     icon: Package,         roles: ['ADMIN'] },
  { name: 'Jasa',        href: '/services',     icon: PenTool,         roles: ['ADMIN'] },
  { name: 'Stok',        href: '/inventory',    icon: Box,             roles: ['ADMIN'] },
  { name: 'Restock',     href: '/restocks',     icon: RefreshCw,       roles: ['ADMIN'] },
  { name: 'Mekanik',     href: '/mechanics',    icon: Users,           roles: ['ADMIN'] },
  { name: 'Pengaturan',  href: '/settings',     icon: Settings,        roles: ['ADMIN'] },
]`;

code = code.replace(oldNavItems, newNavItems);
fs.writeFileSync('src/layouts/AppLayout.tsx', code);
