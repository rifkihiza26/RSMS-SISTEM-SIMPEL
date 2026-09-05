const fs = require('fs');
let code = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');

// Update navItems to add kasirOnly flag
code = code.replace(
  /type NavItem = \{ name: string; href: string; icon: React\.ElementType; adminOnly\?: boolean \}/,
  `type NavItem = { name: string; href: string; icon: React.ElementType; adminOnly?: boolean; kasirOnly?: boolean }`
);

// Kasir menu: kasirOnly
code = code.replace(
  /\{ name: 'Kasir', href: '\/cashier', icon: ShoppingCart \}/,
  `{ name: 'Kasir', href: '/cashier', icon: ShoppingCart, kasirOnly: true }`
);

// Transaksi juga hanya kasir (kasir lihat riwayat, admin lihat di laporan)
// Actually transaksi sebaiknya admin juga bisa akses, jadi biarkan

// Update filter logic
code = code.replace(
  /\/\/ Sembunyikan menu admin jika user bukan admin\n          if \(item\.adminOnly && !isAdmin\) return null;/,
  `// Sembunyikan menu admin dari kasir
          if (item.adminOnly && !isAdmin) return null;
          // Sembunyikan menu kasir dari admin
          if (item.kasirOnly && isAdmin) return null;`
);

fs.writeFileSync('src/layouts/AppLayout.tsx', code);
