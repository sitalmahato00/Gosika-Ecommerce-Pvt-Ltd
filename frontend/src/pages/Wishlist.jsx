import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import api from '../api/client'
import ProductCard from '../components/commerce/ProductCard'
import ProductQuickView from '../components/commerce/ProductQuickView'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { ProductCardSkeletonMini } from '../components/ui/Skeleton'
import { errorMessage } from '../utils/format'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickView, setQuickView] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/wishlist')
      .then((res) => {
        const data = res.data.data
        setItems(data?.items || [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) {
    return (
      <div className="page-shell container">
        <h1 style={{ fontSize: 24 }}>My Wishlist</h1>
        <div className="product-grid mt-2">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeletonMini key={i} />)}
        </div>
      </div>
    )
  }

  if (error) return <div className="page-shell container"><ErrorState message={errorMessage(error)} onRetry={load} /></div>

  const products = items.map((i) => i.product).filter(Boolean)

  if (!products.length) {
    return (
      <div className="page-shell container">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Tap the heart icon on any product to save it here for later."
          action={<Link to="/shop" className="btn btn-primary">Explore products</Link>}
        />
      </div>
    )
  }

  return (
    <div className="page-shell container">
      <h1 style={{ fontSize: 24 }}>My Wishlist ({products.length})</h1>
      <div className="product-grid mt-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
        ))}
      </div>
      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}
