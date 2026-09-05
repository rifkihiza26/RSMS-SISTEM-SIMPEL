import { createRoute, createRootRoute } from '@tanstack/react-router'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './features/dashboard/Dashboard'
import { Login } from './features/auth/Login'
import { Cashier } from './features/cashier/Cashier'
import { Transactions } from './features/transactions/Transactions'
import { Income } from './features/income/Income'
import { Expenses } from './features/expenses/Expenses'
import { Products } from './features/products/Products'
import { Services } from './features/services/Services'
import { Inventory } from './features/inventory/Inventory'
import { Restocks } from './features/restocks/Restocks'
import { Mechanics } from './features/mechanics/Mechanics'
import { Reports } from './features/reports/Reports'
import { Settings } from './features/settings/Settings'

const rootRoute = createRootRoute({
  component: () => <AppLayout />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Redirecting to dashboard...</div>,
})

const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: Dashboard })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const cashierRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cashier', component: Cashier })
const transactionsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/transactions', component: Transactions })
const incomeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/income', component: Income })
const expensesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/expenses', component: Expenses })
const productsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/products', component: Products })
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: Services })
const inventoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: Inventory })
const restocksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/restocks', component: Restocks })
const mechanicsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/mechanics', component: Mechanics })
const reportsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reports', component: Reports })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: Settings })

export const routeTree = rootRoute.addChildren([
  indexRoute, dashboardRoute, loginRoute, cashierRoute, transactionsRoute,
  incomeRoute, expensesRoute, productsRoute, servicesRoute, inventoryRoute,
  restocksRoute, mechanicsRoute, reportsRoute, settingsRoute
])
