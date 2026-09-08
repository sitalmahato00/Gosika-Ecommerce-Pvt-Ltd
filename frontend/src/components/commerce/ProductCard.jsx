import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { money, apiImage, discountPercent, getProductImage } from '../../utils/format'
import RatingStars from './RatingStars'
import { Skeleton } from '../ui/Skeleton'

export function statusOf(product) {
  return product?.stock_status?.value || product?.stock_status
}

export default function ProductCard({ product, onQuickView, variant = 'outline' }) {
  const { addItem } = useCart()
  const { isWishlisted, toggle, busyId } = useWishlist()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const imageUrl = getProductImage(product)
  const stock = statusOf(product)
  const slug = product?.id || product?.uuid
  const discount = discountPercent(product?.price, product?.compare_at_price)
  const adding = false

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await addItem({ productId: product.id, quantity: 1 })
      toast.success('Added to cart')
    } catch {
      toast.error('Could not add to cart')
    }
  }

  const handleWish = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.info('Please login to save items to your wishlist')
      navigate('/login')
      return
    }
    const res = await toggle(product.id)
    if (res?.ok) toast.success(isWishlisted(product.id) ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  const inStock = stock === 'in_stock' || stock === 'low_stock'

  return (
    <div className="card card-pad-none card-hover" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <Link to={`/product/${slug}`} aria-label={product.name} style={{ position: 'relative', display: 'block' }}>
        <div style={{ aspectRatio: '4 / 3', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getProductImage(product)
            }}
          />
        </div>
        {discount && (
          <span className="discount-tag" style={{ position: 'absolute', top: 10, left: 10 }}>
            -{discount}%
          </span>
        )}
        {!inStock && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="badge badge-danger" style={{ fontSize: 13 }}>Out of stock</span>
          </div>
        )}
      </Link>
      <button
        className="icon-btn"
        onClick={handleWish}
        aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: isWishlisted(product.id) ? 'var(--danger-bg)' : '#fff',
          borderColor: isWishlisted(product.id) ? 'var(--danger-border)' : 'var(--border)',
          width: 32,
          height: 32,
        }}
      >
        <Heart size={15} fill={isWishlisted(product.id) ? 'var(--danger)' : 'none'} color={isWishlisted(product.id) ? 'var(--danger)' : 'var(--muted)'} />
      </button>
      <button
        className="icon-btn"
        onClick={handleQuickView}
        aria-label="Quick view"
        style={{ position: 'absolute', top: 10, right: 50, width: 32, height: 32 }}
      >
        <Eye size={15} />
      </button>
      <div className="flex flex-col gap-1 flex-1" style={{ padding: 14 }}>
        {product.brand && (
          <span className="muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {product.brand.name}
          </span>
        )}
        <Link to={`/product/${slug}`} className="line-clamp-2 font-semibold" style={{ fontSize: 14, lineHeight: 1.35, minHeight: 38 }}>
          {product.name}
        </Link>
        {product.store && (
          <Link to={`/store/${product.store.id}`} className="muted text-xs truncate" onClick={(e) => e.stopPropagation()}>
            {product.store.name}
          </Link>
        )}
        <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
          <span className="price-current" style={{ fontSize: 15 }}>{money(product.price)}</span>
          {product.compare_at_price > product.price && (
            <span className="price-old text-xs">{money(product.compare_at_price)}</span>
          )}
        </div>
        <RatingStars value={product.rating_avg} count={product.rating_count} size={12} />
        <div className="mt-auto" style={{ paddingTop: 10 }}>
          {inStock ? (
            <button
              className={variant === 'outline' ? 'btn-cart-outline' : 'btn btn-primary btn-sm btn-block'}
              onClick={handleAdd}
            >
              <ShoppingCart size={14} /> Add to cart
            </button>
          ) : (
            <button className="btn btn-outline btn-sm btn-block" disabled>
              Notify me
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeletonMini() {
  return (
    <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
      <Skeleton height={190} />
      <div style={{ padding: 14 }}>
        <Skeleton height={13} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="50%" style={{ marginBottom: 8 }} />
        <Skeleton height={15} width="45%" />
      </div>
    </div>
  )
}
