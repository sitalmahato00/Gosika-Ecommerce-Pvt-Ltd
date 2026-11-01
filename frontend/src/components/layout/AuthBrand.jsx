import React from 'react'
import { useBranding } from '../../context/BrandingContext'
import { apiImage } from '../../utils/format'
import GosikaLogo from '../common/GosikaLogo'

export default function AuthBrand() {
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || branding.logo_dark

  return (
    <span className="brand" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
      {logoUrl ? (
        <img src={apiImage(logoUrl)} alt={brandName} style={{ height: 42, width: 'auto', maxWidth: 240, objectFit: 'contain' }} />
      ) : (
        <GosikaLogo size={36} showText={false} />
      )}
      <span>{brandName}</span>
    </span>
  )
}