<?php

namespace Database\Seeders;

use App\Modules\Marketing\Infrastructure\Models\Campaign;
use App\Modules\Marketing\Infrastructure\Models\CmsPage;
use Illuminate\Database\Seeder;

class MarketingContentSeeder extends Seeder
{
    public function run(): void
    {
        $campaigns = [
            [
                'title' => 'Dashain Dhamaka Sale',
                'tagline' => 'Up to 30% off on festival essentials',
                'description' => 'Celebrate Dashain with exclusive discounts across handicrafts, electronics and fashion. Every purchase gets a thank-you gift.',
                'image' => 'https://images.unsplash.com/photo-1542204637-e67bc7d41e2a?w=1400&q=80',
                'type' => 'flash_sale',
                'target_type' => 'all',
                'discount_type' => 'percentage',
                'discount_value' => 30,
                'min_order_amount' => 500,
                'status' => 'active',
                'sort_order' => 1,
                'start_date' => now()->subDays(8),
                'end_date' => now()->addDays(6),
            ],
            [
                'title' => 'Tihar Special Collection',
                'tagline' => 'Shine brighter this Tihar',
                'description' => 'Handpicked festive collection with free wrapping. Perfect for Laxmi Puja gifting.',
                'image' => 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1400&q=80',
                'type' => 'discount',
                'target_type' => 'category',
                'target_ids' => null,
                'discount_type' => 'percentage',
                'discount_value' => 15,
                'min_order_amount' => null,
                'status' => 'scheduled',
                'sort_order' => 2,
                'start_date' => now()->addDays(2),
                'end_date' => now()->addDays(16),
            ],
            [
                'title' => 'Free Delivery Weekend',
                'tagline' => 'Zero delivery fees all weekend long',
                'description' => 'Enjoy free doorstep delivery on every order in Kathmandu valley and Pokhara.',
                'image' => 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1400&q=80',
                'type' => 'free_shipping',
                'target_type' => 'all',
                'discount_type' => null,
                'discount_value' => null,
                'min_order_amount' => 1000,
                'status' => 'active',
                'sort_order' => 3,
                'start_date' => now()->subDays(1),
                'end_date' => now()->addDays(3),
            ],
            [
                'title' => 'Festive Gift Bundles',
                'tagline' => 'Bundle more, pay less',
                'description' => 'Curated gift hampers at bundle prices. Ideal for corporate gifting and personal surprises.',
                'image' => 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1400&q=80',
                'type' => 'bundle',
                'target_type' => 'product',
                'target_ids' => null,
                'discount_type' => 'fixed',
                'discount_value' => 200,
                'min_order_amount' => null,
                'status' => 'draft',
                'sort_order' => 4,
                'start_date' => null,
                'end_date' => null,
            ],
            [
                'title' => 'Year-End Clearance',
                'tagline' => 'Last chance at this year’s lowest prices',
                'description' => 'Stock being cleared to make way for the new collection. Limited quantities available.',
                'image' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80',
                'type' => 'special',
                'target_type' => 'all',
                'discount_type' => 'percentage',
                'discount_value' => 40,
                'min_order_amount' => null,
                'status' => 'ended',
                'sort_order' => 5,
                'start_date' => now()->subDays(30),
                'end_date' => now()->subDays(2),
            ],
        ];

        foreach ($campaigns as $campaign) {
            Campaign::updateOrCreate(
                ['title' => $campaign['title']],
                $campaign
            );
        }

        $pages = [
            [
                'title' => 'About Gosika',
                'slug' => 'about-us',
                'excerpt' => 'Your one-stop online marketplace connecting hundreds of trusted Nepali sellers.',
                'body' => "<h2>Who we are</h2><p>Gosika is Nepal's growing online marketplace, connecting customers with trusted local vendors across every province.</p><h2>Our mission</h2><p>We make shopping simple, safe and delightful — from Kathmandu to far western Nepal.</p><h2>Why Gosika</h2><p>Verified vendors, genuine products, fast delivery and secure payments. Shop with confidence.</p>",
                'type' => 'page',
                'status' => 'published',
                'sort_order' => 1,
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'excerpt' => 'How Gosika collects, uses and protects your personal information.',
                'body' => "<h2>Information we collect</h2><p>We collect the information you provide when creating an account, placing an order or contacting support.</p><h2>How we use it</h2><p>Your data is used to process orders, improve services and personalise your shopping experience.</p><h2>Data protection</h2><p>We follow strict security practices and never sell your personal information to third parties.</p><h2>Contact</h2><p>For privacy questions, write to support@gosika.com.np.</p>",
                'type' => 'policy',
                'status' => 'published',
                'sort_order' => 2,
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'excerpt' => 'The terms governing your use of the Gosika marketplace.',
                'body' => "<h2>Acceptance of terms</h2><p>By using Gosika you agree to these terms and our policies.</p><h2>Orders & payments</h2><p>Products are sold at the listed price at the time of order. Prices may change without notice.</p><h2>Liability</h2><p>Gosika acts as a marketplace facilitator. Product quality and delivery are the responsibility of the vendor.</p>",
                'type' => 'policy',
                'status' => 'published',
                'sort_order' => 3,
            ],
            [
                'title' => 'Return & Refund Policy',
                'slug' => 'return-refund-policy',
                'excerpt' => 'Exchange, return and refund rules for eligible products.',
                'body' => "<h2>Eligibility</h2><p>Items may be returned within 7 days of delivery if damaged, defective or not as described.</p><h2>Process</h2><p>Raise a return request from your orders page with supporting photos. We verify and arrange pickup.</p><h2>Refunds</h2><p>Approved refunds are issued within 5-7 business days to the original payment method.</p>",
                'type' => 'policy',
                'status' => 'published',
                'sort_order' => 4,
            ],
            [
                'title' => 'Shipping Policy',
                'slug' => 'shipping-policy',
                'excerpt' => 'Delivery timelines, areas and charges for Gosika orders.',
                'body' => "<h2>Delivery areas</h2><p>We deliver across all 7 provinces of Nepal through our network of delivery partners.</p><h2>Timelines</h2><p>Kathmandu valley: 1-2 days. Outside valley: 3-6 working days.</p><h2>Charges</h2><p>Delivery charges are shown at checkout. Free delivery applies to eligible campaigns and orders above the threshold.</p>",
                'type' => 'policy',
                'status' => 'published',
                'sort_order' => 5,
            ],
            [
                'title' => 'Seller Policy',
                'slug' => 'seller-policy',
                'excerpt' => 'Guidelines every Gosika vendor must follow.',
                'body' => "<h2>Listing standards</h2><p>All products must be genuine, accurately described and priced in NPR.</p><h2>Fulfilment</h2><p>Vendors must pack and dispatch orders within the committed handling time.</p><h2>Compliance</h2><p>Sellers agree to adhere to marketplace rules, quality benchmarks and customer-service standards.</p>",
                'type' => 'policy',
                'status' => 'published',
                'sort_order' => 6,
            ],
            [
                'title' => 'FAQs',
                'slug' => 'faq',
                'excerpt' => 'Answers to common questions about ordering, payment and delivery.',
                'body' => "<h2>How do I track my order?</h2><p>Open My Orders in your account to see live delivery status.</p><h2>What payment methods are accepted?</h2><p>We accept eSewa, Khalti, bank transfer and cash on delivery.</p><h2>How can I become a seller?</h2><p>Apply from the seller page - our team reviews and approves within a few days.</p>",
                'type' => 'page',
                'status' => 'published',
                'sort_order' => 7,
            ],
            [
                'title' => 'Contact Us',
                'slug' => 'contact-us',
                'excerpt' => 'Reach the Gosika team for orders, sellers or partnerships.',
                'body' => "<h2>Customer support</h2><p>Email: support@gosika.com.np</p><h2>Sellers</h2><p>Email: vendor@gosika.com.np</p><h2>Office</h2><p>Gosika Pvt. Ltd., Kathmandu, Nepal</p>",
                'type' => 'page',
                'status' => 'published',
                'sort_order' => 8,
            ],
        ];

        foreach ($pages as $page) {
            CmsPage::updateOrCreate(
                ['slug' => $page['slug']],
                $page
            );
        }
    }
}