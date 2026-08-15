import React from 'react'
import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { apiImage } from '../../utils/format'
import RatingStars from './RatingStars'

export default function VendorCard({ store }) {
  const logo = store.logo || store.logo_url
  const image = store.banner || store.banner_url
  return (
    <Link
      to={`/store/${store.id}`}
      className="card card-hover"
      style={{ padding: 0, overflow: 'hidden', display: 'block' }}
    >
      <div style={{ height: 64, background: 'linear-gradient(120deg, var(--primary), var(--primary-darker))', position: 'relative' }}>
        {image && (
          <img src={apiImage(image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ padding: 14, paddingTop: 30, position: 'relative' }}>
        <div className="avatar" style={{ position: 'absolute', top: -26, left: 14, width: 52, height: 52, border: '3px solid #fff', boxShadow: 'var(--shadow)' }}>
          {logo ? (
            <img src={apiImage(logo)} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Store size={24} />
          )}
        </div>
        <h3 className="m-0 truncate" style={{ fontSize: 15 }}>{store.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <RatingStars value={store.rating_avg} count={store.rating_count} size={12} />
          <span className="muted text-xs">{store.product_count || 0} products</span>
        </div>
      </div>
    </Link>
  )
}
