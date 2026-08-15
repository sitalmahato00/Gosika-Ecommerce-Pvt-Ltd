import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import ProductCard from '../components/ProductCard'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = searchParams.get('page') || '1'

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .get('/products', {
        params: { category: category || undefined, search: search || undefined, sort, page, per_page: 12 },
      })
      .then((r) => {
        setProducts(r.data.data)
        setPagination(r.data.meta || {})
      })
      .finally(() => setLoading(false))
  }, [category, search, sort, page])

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    next.set('page', '1')
    setSearchParams(next)
  }

  return (
    <div className="container">
      <h1 className="page-title">Shop</h1>

      <div className="flex gap-2 wrap" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Search products..."
          defaultValue={search}
          style={{ maxWidth: 280 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParams({ search: e.target.value })
          }}
        />
        <select className="select" value={category} style={{ maxWidth: 200 }} onChange={(e) => updateParams({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select className="select" value={sort} style={{ maxWidth: 200 }} onChange={(e) => updateParams({ sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="flex gap-2 mt-3" style={{ justifyContent: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={pagination.current_page <= 1}
            onClick={() => updateParams({ page: String(Number(page) - 1) })}
          >
            Prev
          </button>
          <span className="muted" style={{ alignSelf: 'center', fontSize: 14 }}>
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => updateParams({ page: String(Number(page) + 1) })}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
