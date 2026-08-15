import React, { useEffect, useState, useParams } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Check, XCircle, Calendar, Eye, Edit, Trash2, Search, Heart, Star, Image, Mail, MailOpen, Clock } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, errorMessage } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useList } from '../../hooks/useApi'

export default function ProductDetail() {
  const { productId } = useParams()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [images, setImages] = useState([])
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/products/${productId}`).then((res) => {
      setProduct(res.data.data)
      setImages(res.data.data.images || [])
      setVariants(res.data.data.variants || [])
    }).catch((e) => setError(e)).finally(() => setLoading(false))
  }, [productId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Skeleton height={200} /><Skeleton height={200} />
        <Skeleton height={400} />
      </div>
    )
  }

  if (error || !product) return <ErrorState message={errorMessage(error, 'Product not found.')} onRetry={() => window.history.back()} />

  // Calculate discount
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: Product Media */}
          <div>
            {/* Large Cover Image */}
            <div className="mb-6">
              <img
                src={product.cover_image || product.images?.[0] || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-[400px] object-cover rounded-lg border bordervar(--border)"
                style={{ width: '100%', height: 400, borderRadius: 12 }}
              />
              <div className="mt-2 flex gap-1">
                {product.images?.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-sm border border-transparent hover:border-primary transition-colors cursor-pointer"
                  />
                ))}
              </div>
            </div>

            {/* Image Gallery */}
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Product Images</h3>
              <div className="grid grid-cols-3 gap-2" style={{ height: 140 }}>
                {product.images?.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={product.name}
                    className="object-cover rounded-sm hover:border-2 border-primary transition-colors"
                  />
                ))}
              </div>
            </div>

            {/* Variant Selection */}
            {variants.length > 0 && (
              <div className="mt-4">
                <h3 style={{ fontSize: 14, marginBottom: 8 }}>Select Variant</h3>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="border rounded-sm p-2 cursor-pointer hover:border-primary"
                      style={{ background: v.is_selected ? 'var(--primary-50)' : 'var(--surface)' }}
                      onClick={() => setVariants(variants.map((v2) => ({ ...v2, is_selected: v2.id === v.id })))}
                    >
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-xs text-muted">{v.sku}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-4 p-3 rounded" style={{
              background: product.stock_status === 'in_stock' ? 'var(--success-bg)' : product.stock_status === 'low_stock' ? 'var(--warning-bg)' : 'var(--danger-bg)',
              color: product.stock_status === 'in_stock' ? 'var(--success)' : product.stock_status === 'low_stock' ? 'var(--warning)' : 'var(--danger)',
              border: `1px solid ${product.stock_status === 'in_stock' ? 'var(--success-border)' : product.stock_status === 'low_stock' ? 'var(--warning-border)' : 'var(--danger-border)'}`
            }}>
              <span className="font-medium">{product.stock_status || 'Unknown'}</span>
              <span className="text-xs ml-2">{product.stock_quantity || 0} in stock</span>
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>{product.name}</h1>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-muted text-xs block">Brand</span>
                <span style={{ fontWeight: 500 }}>{product.brand || '—'}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Category</span>
                <span style={{ fontWeight: 500 }}>{product.category || '—'}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted text-xs block">SKU</span>
                <span style={{ fontWeight: 500 }}>{product.sku || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs block">Price</span>
                <span className="text-xl font-bold text-primary">${product.price}</span>
                {discount > 0 && (
                  <span className="text-danger text-sm line-through ml-2">${product.compare_at_price}</span>
                )}
                {discount > 0 && (
                  <span className="badge badge-primary text-xs ml-2">-{discount}%</span>
                )}
              </div>
              {product.compare_at_price && (
                <div className="flex items-center gap-2 text-muted text-sm">
                  <span>MRP: ${product.compare_at_price}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-muted text-xs block">Stock</span>
              <span style={{ color: product.stock_status === 'in_stock' ? 'var(--success)' : product.stock_status === 'low_stock' ? 'var(--warning)' : 'var(--danger)' }}>
                {product.stock_status || 'Out of stock'} {product.stock_quantity ? `(${product.stock_quantity} available)` : ''}
              </span>
            </div>

            {product.rating > 0 && (
              <div className="mt-3">
                <div style={{ display: 'flex', gap: 2, color: '#f59e0b' }}>
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(product.rating) ? '#f59e0b' : '#e5e7eb'} />
                  ))}
                </div>
                <span className="text-xs text-muted ml-2">({product.rating_count || 0} reviews)</span>
              </div>
            )}

            <div className="mt-4">
              <button className="btn btn-primary w-full">
                <span style={{ flex: 1 }}>Add to Cart</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12hM19 12"/></svg>
              </button>
            </div>

            <div className="mt-4">
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>
                <strong>Vendor:</strong> {product.vendor_name || 'Gosika Marketplace'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>
                <strong>Delivery:</strong> Nationwide across Nepal
              </p>
            </div>

            <div className="mt-6">
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Product Description</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }} />
            </div>

            <div className="mt-4">
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Related Products</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Related item 1', 'Related item 2', 'Related item 3'].map((rel, i) => (
                  <ProductCard key={i} product={{ name: rel, price: Math.floor(Math.random() * 2000) + 500, sku: 'REL-' + i, images: [{ url: '/placeholder-product.jpg' }], brand: 'Brand', category: 'Category' }} showRating />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}