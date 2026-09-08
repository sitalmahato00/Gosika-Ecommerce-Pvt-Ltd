import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BrandingProvider } from './context/BrandingContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ScrollToTop from './components/common/ScrollToTop'
import './styles.css'
import './tailwind.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <BrandingProvider>
          <AuthProvider>
            <ToastProvider>
              <CartProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </CartProvider>
            </ToastProvider>
          </AuthProvider>
        </BrandingProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
