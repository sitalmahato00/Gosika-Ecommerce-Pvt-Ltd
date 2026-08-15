import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiImage, money } from '../../utils/format'
import RatingStars from './RatingStars'
import QtyStepper from './QtyStepper'
import { statusOf } from './ProductCard'

export default function ProductQuickView({ product, onClose }) {
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)

  const image = product?.primary_image?.url || product?.images?.[0]?.url || product?.primary_image
  const stock = statusOf(product)
  const inStock = stock === 'in_stock' || stock === 'low_stock'
  const slug = product?.id || product?.uuid

  const handleAdd = async () => {
    if (!inStock) return
    setBusy(true)
    try {
      await addItem({ productId: product.id, quantity: qty })
      toast.success('Added to cart')
      onClose()
    } catch {
      toast.error('Could not add to cart')
    } finally {
      setBusy(false)
    }
  }

  const handleWish = async () => {
    if (!user) {
      toast.info('Please login to save items to your wishlist')
      navigate('/login')
      return
    }
    await toggle(product.id)
  }

  return (
    <Modal open onClose={onClose} size="lg">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="qv-grid">
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: 260 }}>
          {image && <img src={apiImage(image)} alt={product.name} style={{ width: '100%', height: '100%', maxHeight: 340, objectFit: 'cover' }} />}
        </div>
        <div>
          {product.brand && <div className="muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.brand.name}</div>}
          <h3 className="m-0" style={{ fontSize: 18 }}>{product.name}</h3>
          <RatingStars value={product.rating_avg} count={product.rating_count} size={14} />
          <div style={{ margin: '12px 0' }}>
            <span className="price-current" style={{ fontSize: 22 }}>{money(product.price)}</span>
            {product.compare_at_price > product.price && (
              <span className="price-old" style={{ marginLeft: 8 }}>{money(product.compare_at_price)}</span>
            )}
          </div>
          <div className="flex items-center gap-3 wrap" style={{ margin: '16px 0' }}>
            <QtyStepper value={qty} onChange={setQty} min={1} max={Math.max(1, Number(product.quantity) || 99)} />
            <Button onClick={handleAdd} disabled={!inStock || busy} icon={ShoppingCart}>
              {inStock ? 'Add to Cart' : 'Out of stock'}
            </Button>
            <button className="icon-btn icon-btn-lg" onClick={handleWish} aria-label="Toggle wishlist">
              <Heart size={18} fill={isWishlisted(product.id) ? 'var(--danger)' : 'none'} color={isWishlisted(product.id) ? 'var(--danger)' : 'var(--muted)'} />
            </button>
          </div>
          <Link to={`/product/${slug}`} onClick={onClose} className="btn btn-soft btn-sm">
            View full details
          </Link>
        </div>
      </div>
      <style>{`
        @media (min-width: '720px') { .qv-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </Modal>
  )
}
