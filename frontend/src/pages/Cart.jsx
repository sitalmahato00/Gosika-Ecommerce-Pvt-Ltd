import React, { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Trash2, Store, ArrowRight, Lock,
  ShoppingCart, ChevronRight, Banknote,
  Wallet, CreditCard, Smartphone, CheckSquare, Square
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { money, apiImage, getProductImage } from '../utils/format'
import EmptyState from '../components/ui/EmptyState'
import QtyStepper from '../components/commerce/QtyStepper'
import { Skeleton } from '../components/ui/Skeleton'

export default function Cart() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('gosika_selected_cart_items')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  // Sync selectedIds with cart items: if cart changes and selectedIds is empty, select all
  useEffect(() => {
    if (cart?.items?.length) {
      setSelectedIds((prev) => {
        const itemIds = cart.items.map((i) => i.id)
        if (prev.length === 0) return itemIds
        const valid = prev.filter((id) => itemIds.includes(id))
        return valid.length > 0 ? valid : itemIds
      })
    }
  }, [cart?.items])

  const selectedItems = useMemo(() => {
    return (cart?.items || []).filter((item) => selectedIds.includes(item.id))
  }, [cart?.items, selectedIds])

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
  }, [selectedItems])

  const selectedCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  }, [selectedItems])

  const allSelected = cart?.items?.length > 0 && selectedItems.length === cart.items.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      localStorage.setItem('gosika_selected_cart_items', JSON.stringify([]))
    } else {
      const allIds = (cart?.items || []).map((i) => i.id)
      setSelectedIds(allIds)
      localStorage.setItem('gosika_selected_cart_items', JSON.stringify(allIds))
    }
  }

  const toggleItem = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('gosika_selected_cart_items', JSON.stringify(next))
      return next
    })
  }

  const toggleStore = (storeItems) => {
    const storeIds = storeItems.map((i) => i.id)
    const allStoreSelected = storeIds.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => {
      const next = allStoreSelected
        ? prev.filter((id) => !storeIds.includes(id))
        : Array.from(new Set([...prev, ...storeIds]))
      localStorage.setItem('gosika_selected_cart_items', JSON.stringify(next))
      return next
    })
  }

  const handleProceedToCheckout = () => {
    if (!selectedItems.length) {
      toast.error('Please select at least one item to checkout.')
      return
    }
    localStorage.setItem('gosika_selected_cart_items', JSON.stringify(selectedIds))
    navigate('/checkout', { state: { selectedItemIds: selectedIds } })
  }

  const groups = useMemo(() => {
    const g = []
    const map = new Map()
    for (const item of cart?.items || []) {
      const key = item.store?.id || 'others'
      if (!map.has(key)) {
        const entry = { key, store: item.store, vendorName: item.vendor_name, items: [] }
        map.set(key, entry)
        g.push(entry)
      }
      map.get(key).items.push(item)
    }
    return g
  }, [cart])

  const handleUpdate = async (item, qty) => {
    try {
      await updateItem(item.id, qty)
    } catch {
      toast.error('Could not update quantity')
    }
  }

  const handleRemove = async (item) => {
    try {
      await removeItem(item.id)
      toast.success('Item removed from cart')
    } catch {
      toast.error('Could not remove item')
    }
  }

  const handleClear = async () => {
    try {
      await clearCart()
      toast.success('Cart cleared')
    } catch {
      toast.error('Could not clear cart')
    }
  }

  if (loading) {
    return (
      <div className="page-shell container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={32} width={200} />
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={280} />
        </div>
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="page-shell container">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Explore products from trusted vendors across Nepal."
          action={
            <Link to="/shop" className="btn btn-primary btn-lg">
              Start Shopping <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Shopping Cart</span>
      </nav>

      <div className="flex items-center justify-between wrap gap-2" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>
          Shopping Cart
          <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)', marginLeft: 10 }}>
            ({cart.item_count} item{cart.item_count !== 1 ? 's' : ''})
          </span>
        </h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleClear}
          disabled={!cart.item_count}
        >
          <Trash2 size={14} /> Clear cart
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 24,
          alignItems: 'start',
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
        id="cart-layout"
      >
        <style>{`
          @media (min-width: 1024px) {
            #cart-layout { grid-template-columns: minmax(0, 1fr) 340px !important; }
          }
        `}</style>

        {/* ---- Items column ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Select all bar */}
          <div
            className="card"
            style={{
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0, fontWeight: 700, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer', width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
              <span>Select All Items ({selectedItems.length}/{cart.items.length})</span>
            </label>
            {selectedItems.length < cart.items.length && (
              <span className="muted text-xs">
                {selectedItems.length} selected ({money(selectedSubtotal)})
              </span>
            )}
          </div>

          {groups.map((g) => {
            const groupTotal = g.items.reduce((s, i) => s + Number(i.total_price || 0), 0)
            const allStoreSelected = g.items.every((i) => selectedIds.includes(i.id))
            return (
              <div key={g.key} className="card card-pad-none" style={{ overflow: 'hidden' }}>
                {/* Store header */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={allStoreSelected}
                      onChange={() => toggleStore(g.items)}
                      style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--primary)' }}
                      title="Select all items in this store"
                    />
                    <span className="flex items-center gap-2 font-semibold" style={{ fontSize: 14 }}>
                      <Store size={16} color="var(--primary)" />
                      {g.store ? (
                        <Link to={`/store/${g.store.id}`} style={{ color: 'var(--primary)' }}>
                          {g.store.name}
                        </Link>
                      ) : (
                        g.vendorName || 'Store'
                      )}
                    </span>
                  </div>
                  <span className="muted text-sm">
                    {g.items.length} item{g.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Items */}
                {g.items.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: '26px 72px 1fr auto',
                        gap: 14,
                        alignItems: 'center',
                        background: isChecked ? 'transparent' : 'rgba(241, 245, 249, 0.45)',
                        opacity: isChecked ? 1 : 0.75,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          style={{ cursor: 'pointer', width: 18, height: 18, accentColor: 'var(--primary)' }}
                          title={isChecked ? 'Deselect item' : 'Select item to purchase'}
                        />
                      </div>

                      {/* Image */}
                      <Link to={`/product/${item.product_id}`}>
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={item.image ? apiImage(item.image, item.name) : getProductImage(item, 0, true)}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = getProductImage(item, 0, true) }}
                          />
                        </div>
                      </Link>

                      {/* Details */}
                      <div style={{ minWidth: 0 }}>
                        <Link to={`/product/${item.product_id}`} className="font-semibold line-clamp-2" style={{ fontSize: 14 }}>
                          {item.name}
                        </Link>
                        {item.variant_name && (
                          <div className="muted text-xs mt-1">{item.variant_name}</div>
                        )}
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="muted text-xs mt-1">
                            {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                          <span className="font-semibold" style={{ fontSize: 14, color: 'var(--primary)' }}>
                            {money(item.unit_price)}
                          </span>
                          <QtyStepper
                            compact
                            value={item.quantity}
                            onChange={(q) => handleUpdate(item, q)}
                            max={99}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span className="font-bold" style={{ fontSize: 15 }}>
                          {money(item.total_price)}
                        </span>
                        <button
                          className="icon-btn"
                          style={{ width: 32, height: 32, border: 'none', color: 'var(--muted)' }}
                          onClick={() => handleRemove(item)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Store subtotal */}
                <div
                  style={{
                    padding: '10px 18px',
                    background: 'var(--bg)',
                    textAlign: 'right',
                    fontSize: 13,
                    color: 'var(--muted)',
                  }}
                >
                  Subtotal for <strong style={{ color: 'var(--ink)' }}>{g.store?.name || 'this store'}</strong>:&nbsp;
                  <strong style={{ color: 'var(--ink)', fontSize: 14 }}>{money(groupTotal)}</strong>
                </div>
              </div>
            )
          })}

          {/* Login nudge for guests */}
          {!user && (
            <div className="alert alert-info" style={{ margin: 0 }}>
              <ShoppingCart size={18} />
              <div style={{ flex: 1 }}>
                <strong>Have an account?</strong> Login to view saved addresses and speed up your checkout.
              </div>
              <Link to="/login?redirect=/cart" className="btn btn-primary btn-sm">
                Login
              </Link>
            </div>
          )}

          {/* Continue shopping */}
          <Link to="/shop" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Continue Shopping
          </Link>
        </div>

        {/* ---- Order summary column ---- */}
        <div className="order-summary-panel">
          <div className="order-summary-header">
            Order Summary
          </div>
          <div className="order-summary-body">
            <div className="order-summary-row">
              <span className="muted">Subtotal ({selectedCount} item{selectedCount !== 1 ? 's' : ''})</span>
              <span className="font-semibold">{money(selectedSubtotal)}</span>
            </div>
            <div className="order-summary-row">
              <span className="muted">Shipping</span>
              <span className="text-success font-semibold" style={{ fontSize: 13 }}>Calculated at checkout</span>
            </div>
            <div className="order-summary-row">
              <span className="muted">Tax</span>
              <span className="font-semibold" style={{ fontSize: 13, color: 'var(--muted)' }}>Calculated at checkout</span>
            </div>

            <div className="order-summary-total">
              <span>Total</span>
              <span style={{ color: 'var(--ink)' }}>{money(selectedSubtotal)}</span>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 16 }}
              onClick={handleProceedToCheckout}
              disabled={!selectedItems.length}
            >
              {selectedItems.length > 0
                ? `Proceed to Checkout (${selectedCount})`
                : 'Select Items to Checkout'
              } <ArrowRight size={16} />
            </button>

            <p className="muted text-xs flex items-center gap-1 justify-center" style={{ marginTop: 10 }}>
              <Lock size={12} /> Secure checkout · SSL Encrypted
            </p>

            {/* Payment methods */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Accepted Payments
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'COD', icon: Banknote, img: null },
                  { label: 'Khalti', icon: Wallet, img: null },
                  { label: 'eSewa', icon: null, img: '/payments/esewa/esewa-icon.png' },
                  { label: 'Fonepay', icon: Smartphone, img: null }
                ].map((m) => (
                  <span
                    key={m.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--muted)',
                    }}
                  >
                    {m.img
                      ? <img src={m.img} alt={m.label} style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: '50%' }} />
                      : <m.icon size={12} color="var(--primary)" />
                    } {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
