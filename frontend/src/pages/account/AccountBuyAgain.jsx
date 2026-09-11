import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCcw } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

const DELIVERED_STATUSES = ['delivered', 'completed', 'processing', 'ready_for_pickup', 'out_for_delivery']

export default function AccountBuyAgain() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/orders', { params: { per_page: 100 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        const orders = Array.isArray(raw) ? raw : []
        const seen = new Set()
        const items = []
        orders
          .filter((o) => DELIVERED_STATUSES.includes(o.status))
          .forEach((o) => {
            ;(o.items || []).forEach((it) => {
              if (!it.product_id || seen.has(it.product_id)) return
              seen.add(it.product_id)
              items.push({
                id: it.product_id,
                name: it.product_name,
                price: Number(it.unit_price) || 0,
                compare_at_price: null,
                stock_status: 'in_stock',
                primary_image: it.image ? { url: it.image } : null,
              })
            })
          })
        setProducts(items)
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Buy Again" subtitle="Items from your past orders — reorder them in one tap.">
        <AccountSkeleton rows={3} height={220} asCards={false} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Buy Again" subtitle="Items from your past orders — reorder them in one tap.">
        <AccountError message="Could not load your past orders." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="Buy Again" subtitle="Items from your past orders — reorder them in one tap.">
      {products.length === 0 ? (
        <AccountEmpty
          icon={RefreshCcw}
          title="Nothing to reorder yet"
          message="Products you have ordered will appear here so you can buy them again easily."
          action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </AccountPage>
  )
}