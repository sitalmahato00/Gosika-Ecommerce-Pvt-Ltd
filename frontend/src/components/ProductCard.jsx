import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { money, apiImage, getProductImage } from '../utils/format'
import { Package } from 'lucide-react'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  const imageUrl = getProductImage(product)
  const stock = product.stock_status?.value || product.stock_status

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product.id}`}>
        <div
          style={{
            height: 200,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
          />
        </div>
      </Link>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <Link to={`/product/${product.id}`} style={{ fontWeight: 600, fontSize: 15 }}>
          {product.name}
        </Link>
        {product.brand && <span className="muted" style={{ fontSize: 12 }}>{product.brand.name}</span>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{money(product.price)}</span>
          {product.compare_at_price > product.price && (
            <span className="muted" style={{ textDecoration: 'line-through', fontSize: 13 }}>
              {money(product.compare_at_price)}
            </span>
          )}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {stock === 'in_stock' || stock === 'low_stock' ? (
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => addItem(product)}>
              Add to cart
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }} disabled>
              Out of stock
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
