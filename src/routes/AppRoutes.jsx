import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../layouts/Layout'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'
import { Spinner } from '../components/States'
import Home from '../pages/Home'
import Catalog from '../pages/Catalog'
import Product from '../pages/Product'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import OrderSuccess from '../pages/OrderSuccess'
import SearchPage from '../pages/SearchPage'
import AuthPage from '../pages/AuthPage'
import ForgotPassword from '../pages/ForgotPassword'
import Favorites from '../pages/Favorites'
import Compare from '../pages/Compare'
import InfoPage from '../pages/InfoPage'
import NotFound from '../pages/NotFound'
import Forbidden from '../pages/Forbidden'
import ProfileLayout from '../pages/profile/ProfileLayout'
import ProfileOrders from '../pages/profile/ProfileOrders'
import ProfileFavorites from '../pages/profile/ProfileFavorites'
import ProfileViewed from '../pages/profile/ProfileViewed'
import ProfileData from '../pages/profile/ProfileData'

// Админ-панель грузится отдельным файлом, обычным покупателям она не нужна
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'))
const AdminClients = lazy(() => import('../pages/admin/AdminClients'))

const Fallback = () => (
  <div className="container section" style={{ textAlign: 'center' }}>
    <Spinner />
  </div>
)

export default function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:category" element={<Catalog />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/success/:orderId" element={<OrderSuccess />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="compare" element={<Compare />} />
          <Route path="info/:slug" element={<InfoPage />} />
          <Route path="forbidden" element={<Forbidden />} />

          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfileLayout />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<ProfileOrders />} />
              <Route path="favorites" element={<ProfileFavorites />} />
              <Route path="viewed" element={<ProfileViewed />} />
              <Route path="data" element={<ProfileData />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="clients" element={<AdminClients />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
