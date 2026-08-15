import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import api from '../api/client'
import { useWishlist } from '../context/WishlistContext'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { ProductCardSkeletonMini } from '../components/ui/Skeleton'
import { money, errorMessage, getProductImage } from '../utils/format'

export default function Wishlist() {
  const { toggle } = useWishlist()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removing, setRemoving] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/wishlist')
      .then((res) => {
        const data = res.data.data || res.data
        setItems(data?.items || [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRemove = async (item) => {
    const productId = item.product?.id || item.product_id
    if (!productId) return
    setRemoving(productId)
    const res = await toggle(productId)
    setRemoving(null)
    if (res?.ok) {
      setItems((prev) => prev.filter((i) => (i.product?.id || i.product_id) !== productId))
    }
  }

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

  if (!items.length) {
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
      <h1 style={{ fontSize: 24 }}>My Wishlist ({items.length})</h1>
      <div className="product-grid mt-2">
        {items.map((item) => {
          const product = item.product
          const productId = product?.id || item.product_id
          if (!product) return null
          return (
            <div key={productId} className="card card-pad-none card-hover" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <Link to={`/product/${productId}`} aria-label={product.name} style={{ position: 'relative', display: 'block' }}>
                <div style={{ height: 150, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </Link>
              <div style={{ padding: 12 }}>
                <Link to={`/product/${productId}`} className="line-clamp-2 font-semibold" style={{ fontSize: 14, lineHeight: 1.35, minHeight: 38, display: 'block' }}>
                  {product.name}
                </Link>
                <span className="price-current" style={{ fontSize: 15 }}>{money(product.price)}</span>
              </div>
              <div style={{ padding: '0 12px 12px', marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-block"
                  onClick={() => handleRemove(item)}
                  disabled={removing === productId}
                >
                  <X size={13} /> {removing === productId ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
