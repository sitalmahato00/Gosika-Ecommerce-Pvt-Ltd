import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Truck, Calendar, CreditCard, Mail, Phone, MapPin, XCircle } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function Checkout() {
  const [step, setStep] = useState(1)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Get cart items
  const [items, setItems] = useState([])
  const [subtotal, setSubtotal] = useState(0)

  useEffect(() => {
    api.get('/cart').then((res) => {
      setItems(res.data.data?.items || [])
      setSubtotal(res.data.data?.subtotal || 0)
    })
  }, [])

  const addresses = [
    { id: 1, name: 'John Doe', phone: '9841234567', address: 'Kathmandu, Ward 5', isDefault: true },
    { id: 2, name: 'Jane Smith', phone: '9851234567', address: 'Pokhara, Lake Side', isDefault: false },
  ]

  const shippingOptions = [
    { id: 1, name: 'Standard Delivery', time: '3-5 days', cost: 0 },
    { id: 2, name: 'Express Delivery', time: '1-2 days', cost: 150 },
  ]

  const paymentOptions = [
    { id: 1, name: 'Cash on Delivery', extra: 'Pay at delivery' },
    { id: 2, name: 'Easypaisa', extra: 'Mobile wallet' },
    { id: 3, name: 'Khalti', extra: 'QR code payment' },
  ]

  const handleSubmit = () => {
    // Create order
    api.post('/checkout', {
      items: items.map((i) => ({ product_id: i.id, quantity: i.quantity || 1 })),
      address_id: 1,
      payment_method: 1,
    }).then(() => {
      navigate('/order-success')
    }).catch((e) => toast.error('Failed to create order'))
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Checkout</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart Summary */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="p-3 rounded" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <img
                    src={item.cover_image || item.images?.[0] || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-sm"
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span className="text-xs text-muted ml-2">× {item.quantity}</span>
                  </span>
                </div>
                <span className="font-medium">${item.price}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
          </div>

          {/* Step 1: Address */}
          <div step={1} className="space-y-4">
            <h3 style={{ fontSize: 16 }}>Step 1: Address</h3>
            <select defaultValue="1" style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
              <option value="">Select address</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Delivery */}
          <div step={2} className="space-y-4">
            <h3 style={{ fontSize: 16 }}>Step 2: Delivery</h3>
            <select style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
              <option value="">Select delivery</option>
              {shippingOptions.map((s) => (
                <option key={s.id} style={{ fontWeight: 500 }}>
                  {s.name} - {s.time} (Rs. {s.cost})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Payment */}
          <div step={3} className="space-y-4">
            <h3 style={{ fontSize: 16 }}>Step 3: Payment</h3>
            <select style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
              <option value="">Select payment method</option>
              {paymentOptions.map((p) => (
                <option key={p.id} style={{ fontWeight: 500 }}>
                  {p.name} - {p.extra}
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Review */}
          <div step={4} className="space-y-4">
            <h3 style={{ fontSize: 16 }}>Step 4: Review</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Order Summary:</p>
            {items.map((item) => (
              <div key={item.id} style={{ margin: '8px 0', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span className="text-xs text-muted ml-2">× {item.quantity}</span>
                <span>${item.price}</span>
              </div>
            ))}
            <div style={{ margin: '10px 0', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <span>Total</span>
              <span style={{ fontWeight: 600 }>${subtotal}</span>
            </div>
          </div>

          {/* Step 5: Success */}
          {step === 5 && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <h3 style={{ fontSize: 24, color: 'var(--success)' }}>Order Placed Successfully!</h3>
              <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 16 }}>
                Order #ORD-001234
              </p>
              <p style={{ fontSize: 16 }}>Your order will be delivered within 3-5 days.</p>
              <a href="/orders" className="btn btn-primary">View Order</a>
              <a href="/shop" className="btn btn-outline">Continue Shopping</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}