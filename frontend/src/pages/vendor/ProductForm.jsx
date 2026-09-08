import React, { useState, useEffect, useParams } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderPlus, Folder, Image, Grid, Layout, Tag, Palette, CheckCircle, XCircle, Clock, Calendar, Trash, Check, Eye, Edit, Settings, MapPin, Mail, Phone, Heart, Shield, LayoutDashboard, Loader2 } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function VendorProductForm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [isEdit, setIsEdit] = useState(false)

  // State for all 9 sections
  const [media, setMedia] = useState({
    cover_image: '',
    gallery_images: [],
  })

  const [variants, setVariants] = useState({
    name: '',
    sku: '',
    price: '',
    compare_at_price: '',
    stock: '',
    track_inventory: true,
  })

  const [pricing, setPricing] = useState({
    cost_price: '',
    profit_margin: 0,
    min_quantity: 1,
    sale_price: '',
  })

  const [seo, setSEO] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  })

  const [related, setRelated] = useState({
    related_product_ids: [],
  })

  const [attributes, setAttributes] = useState({
    weight: '',
    dimensions: '',
    color: '',
    size: '',
  })

  const [shipping, setShipping] = useState({
    weight: '',
    length: '',
    width: '',
    height: '',
    shipping_class: 'standard',
  })

  // Fetch product if editing
  useEffect(() => {
    setIsEdit(!!productId)
    if (productId) {
      api.get(`/vendor/products/${productId}`).then((res) => {
        const p = res.data.data || {}
        setMedia({
          cover_image: p.cover_image || '',
          gallery_images: p.gallery_images || [],
        })
        setVariants({
          name: p.name,
          sku: p.sku || '',
          price: p.price || '',
          compare_at_price: p.compare_at_price || '',
          stock: p.stock || '',
          track_inventory: p.track_inventory !== false,
        })
        setPricing({
          cost_price: p.cost_price || '',
          profit_margin: p.profit_margin || 0,
          min_quantity: p.min_quantity || 1,
          sale_price: p.sale_price || '',
        })
        setSEO({
          meta_title: p.meta_title || '',
          meta_description: p.meta_description || '',
          meta_keywords: p.meta_keywords || '',
        })
        setRelated({
          related_product_ids: p.related_product_ids || [],
        })
        setAttributes({
          weight: p.weight || '',
          dimensions: p.dimensions || '',
          color: p.color || '',
          size: p.size || '',
        })
        setShipping({
          weight: p.shipping_weight || '',
          length: p.length || '',
          width: p.width || '',
          height: p.height || '',
          shipping_class: p.shipping_class || 'standard',
        })
        setLoading(false)
      }).catch(() => {
        setLoading(false)
        toast.error('Failed to load product')
        navigate('/vendor/products')
      })
    } else {
      setLoading(false)
    }
  }, [productId])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...media,
        ...variants,
        ...pricing,
        ...seo,
        ...related,
        ...attributes,
        ...shipping,
      }
      let endpoint
      let method
      if (isEdit && productId) {
        endpoint = `/vendor/products/${productId}`
        method = 'PUT'
      } else {
        endpoint = '/vendor/products'
        method = 'POST'
      }
      await api[method](endpoint, data)
      toast.success(isEdit ? 'Product updated successfully' : 'Product created successfully')
      setTimeout(() => navigate('/vendor/products'), 1500)
    } catch (e) {
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Product Form */}
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>{isEdit ? 'Edit Product' : 'Add Product'}</h2>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Media Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Product Media</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <input
                      type="text"
                      value={media.cover_image}
                      onChange={(e) => setMedia({ ...media, cover_image: e.target.value })}
                      placeholder="Product cover image URL"
                      className="w-full rounded-sm border p-2"
                      style={{ border: '2px dashed var(--border)' }}
                    />
                    <span className="text-xs text-muted mt-1">URL or upload later</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gallery Images</label>
                    <input
                      type="text"
                      value={media.gallery_images.join(', ') || ''}
                      onChange={(e) => setMedia({ ...media, gallery_images: e.target.value.split(',').filter(Boolean) })}
                      placeholder="image1.jpg, image2.jpg, ..."
                      className="w-full rounded-sm border p-2"
                      style={{ border: '2px dashed var(--border)' }}
                    />
                    <span className="text-xs text-muted mt-1">Comma-separated URLs</span>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Product Variants</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">SKU</label>
                    <input
                      value={variants.sku}
                      onChange={(e) => setVariants({ ...variants, sku: e.target.value })}
                      placeholder="SKU12345"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Track Inventory</label>
                    <select
                      value={variants.track_inventory ? 'Yes' : 'No'}
                      onChange={(e) => setVariants({ ...variants, track_inventory: e.target.value === 'Yes' })}
                      className="w-full rounded-sm border p-2"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (Rs.)</label>
                    <input
                      value={variants.price}
                      onChange={(e) => setVariants({ ...variants, price: e.target.value })}
                      placeholder="1299"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Compare At Price</label>
                    <input
                      value={variants.compare_at_price}
                      onChange={(e) => setVariants({ ...variants, compare_at_price: e.target.value })}
                      placeholder="Leave blank for no comparison"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                  <input
                    value={variants.stock}
                    onChange={(e) => setVariants({ ...variants, stock: e.target.value })}
                    placeholder="0"
                    type="number"
                    className="w-full rounded-sm border p-2"
                  />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Inventory will be tracked if enabled above.</p>
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cost Price (Rs.)</label>
                    <input
                      value={pricing.cost_price}
                      onChange={(e) => setPricing({ ...pricing, cost_price: e.target.value })}
                      placeholder="Cost price"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Profit Margin (%)</label>
                    <input
                      value={pricing.profit_margin}
                      onChange={(e) => setPricing({ ...pricing, profit_margin: Number(e.target.value) })}
                      placeholder="Margin %"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Quantity</label>
                    <input
                      value={pricing.min_quantity}
                      onChange={(e) => setPricing({ ...pricing, min_quantity: Number(e.target.value) })}
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sale Price</label>
                    <input
                      value={pricing.sale_price}
                      onChange={(e) => setPricing({ ...pricing, sale_price: e.target.value })}
                      placeholder="Automatic from margin"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>SEO Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Meta Title</label>
                    <input
                      value={seo.meta_title}
                      onChange={(e) => setSEO({ ...seo, meta_title: e.target.value })}
                      placeholder="Product name"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Meta Description</label>
                    <textarea
                      value={seo.meta_description}
                      onChange={(e) => setSEO({ ...seo, meta_description: e.target.value })}
                      placeholder="Description for search engines"
                      rows={2}
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Meta Keywords</label>
                  <input
                    value={seo.meta_keywords}
                    onChange={(e) => setSEO({ ...seo, meta_keywords: e.target.value })}
                    placeholder="comma, separated, keywords"
                    className="w-full rounded-sm border p-2"
                  />
                </div>
              </div>

              {/* Related Products Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Related Products</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Select products that are frequently bought together or are complementary.</p>
                <div className="grid grid-cols-2 gap-2" style={{ flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((id) => (
                    <div key={id} className="p-3 rounded hover:bg-['var(--surface)'] transition-colors cursor-pointer" style={{ border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>Product {id}</span>
                      <input
                        type="checkbox"
                        id={`related-${id}`}
                        name={`related-${id}`}
                      />
                      <label htmlFor={`related-${id}`} className="ml-2 text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Attributes Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Product Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                    <input
                      value={attributes.weight}
                      onChange={(e) => setAttributes({ ...attributes, weight: e.target.value })}
                      placeholder="1.5"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dimensions (cm)</label>
                    <input
                      value={attributes.dimensions}
                      onChange={(e) => setAttributes({ ...attributes, dimensions: e.target.value })}
                      placeholder "L×W×H"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      value={attributes.color}
                      onChange={(e) => setAttributes({ ...attributes, color: e.target.value })}
                      placeholder="e.g., Red, Blue, Green"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <input
                      value={attributes.size}
                      onChange={(e) => setAttributes({ ...attributes, size: e.target.value })}
                      placeholder="S, M, L, XL"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Section */}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 10 }}>Shipping Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Shipping Weight (kg)</label>
                    <input
                      value={shipping.weight}
                      onChange={(e) => setShipping({ ...shipping, weight: e.target.value })}
                      placeholder="Weight"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Shipping Class</label>
                    <select
                      value={shipping.shipping_class}
                      onChange={(e) => setShipping({ ...shipping, shipping_class: e.target.value })}
                      className="w-full rounded-sm border p-2"
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="fragile">Fragile</option>
                      <option value="oversize">Oversize</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Length (cm)</label>
                    <input
                      value={shipping.length}
                      onChange={(e) => setShipping({ ...shipping, length: e.target.value })}
                      placeholder="Length"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (cm)</label>
                    <input
                      value={shipping.width}
                      onChange={(e) => setShipping({ ...shipping, width: e.target.value })}
                      placeholder="Width"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (cm)</label>
                    <input
                      value={shipping.height}
                      onChange={(e) => setShipping({ ...shipping, height: e.target.value })}
                      placeholder="Height"
                      type="number"
                      className="w-full rounded-sm border p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                  {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Product Preview */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>{isEdit ? 'Preview' : 'Product Preview'}</h3>

            <div className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isEdit && media.cover_image ? (
                <img
                  src={media.cover_image}
                  alt={variants.name || 'Product'}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--navy)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>{isEdit ? 'Cover will appear here' : 'Add cover image'}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p style={{ fontSize: 13 }}><strong>Name:</strong> {variants.name || '—'}</p>
              <p style={{ fontSize: 13 }}><strong>SKU:</strong> {variants.sku || '—'}</p>
              <p style={{ fontSize: 13 }}><strong>Price:</strong> Rs. {variants.price || '—'}</p>
              <p style={{ fontSize: 13 }}><strong>Stock:</strong> {variants.stock || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}