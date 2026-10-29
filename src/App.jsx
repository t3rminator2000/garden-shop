import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CompareProvider } from './context/CompareContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { UIProvider } from './context/UIContext'
import AppRoutes from './routes/AppRoutes'

// Обычная сборка работает на сервере и даёт чистые адреса.
// Сборка для флешки открывается из файла, там адреса идут через решётку (HashRouter).
const offline = import.meta.env.VITE_ROUTER === 'hash'
const Router = offline ? HashRouter : BrowserRouter
const routerProps = offline ? {} : { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined }

export default function App() {
  return (
    <Router {...routerProps}>
      <UIProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
      </UIProvider>
    </Router>
  )
}
