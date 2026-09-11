import React from 'react'
import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { AccountPage, AccountEmpty } from './AccountUI'

export default function AccountVouchers() {
  return (
    <AccountPage title="My Discount Vouchers" subtitle="Vouchers and promo codes you can use at checkout.">
      <AccountEmpty
        icon={Ticket}
        title="No vouchers yet"
        message="When coupons or promotional vouchers are added to your account, they will show up here. Keep an eye on Deals & Offers."
        action={<>
          <Link to="/deals" className="btn btn-primary" style={{ marginRight: 8 }}>View Deals</Link>
          <Link to="/shop" className="btn btn-outline">Start Shopping</Link>
        </>}
      />
    </AccountPage>
  )
}