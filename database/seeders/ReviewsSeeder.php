<?php

namespace Database\Seeders;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketplace\Infrastructure\Models\ProductQuestion;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Marketplace\Infrastructure\Models\StoreReview;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ReviewsSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::query()->where('status', \App\Modules\Shared\Domain\Enums\ProductStatus::PUBLISHED)->get();
        $store = Store::query()->where('status', \App\Modules\Shared\Domain\Enums\StoreStatus::ACTIVE)->first();

        if ($products->isEmpty()) {
            $this->command?->warn('No published products found. ReviewsSeeder skipped.');

            return;
        }

        $reviewers = [];
        $reviewerData = [
            ['first_name' => 'Sunsari', 'last_name' => 'Sharma', 'email' => 'sunsari.sharma@example.com', 'phone' => '9800000101'],
            ['first_name' => 'Karan', 'last_name' => 'Gurung', 'email' => 'karan.gurung@example.com', 'phone' => '9800000102'],
            ['first_name' => 'Priya', 'last_name' => 'Tamang', 'email' => 'priya.tamang@example.com', 'phone' => '9800000103'],
            ['first_name' => 'Bibek', 'last_name' => 'Rai', 'email' => 'bibek.rai@example.com', 'phone' => '9800000104'],
            ['first_name' => 'Anisha', 'last_name' => 'Shrestha', 'email' => 'anisha.shrestha@example.com', 'phone' => '9800000105'],
            ['first_name' => 'Dawa', 'last_name' => 'Lama', 'email' => 'dawa.lama@example.com', 'phone' => '9800000106'],
        ];

        foreach ($reviewerData as $data) {
            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'uuid' => (string) Str::uuid(),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'phone_verified_at' => now(),
                    'status' => UserStatus::ACTIVE,
                ])
            );
            $user->assignRole(Roles::CUSTOMER);
            $reviewers[] = $user;
        }

        ProductReview::query()->delete();
        StoreReview::query()->delete();
        ProductQuestion::query()->delete();

        $productReviewTemplates = [
            ['rating' => 5, 'title' => 'Absolutely stunning craftsmanship', 'body' => 'The quality exceeded my expectations. Packaging was neat and delivery arrived ahead of schedule. Highly recommended!'],
            ['rating' => 5, 'title' => 'Authentic Nepali quality', 'body' => 'You can feel the care that went into this product. It matches the photos perfectly and feels premium.'],
            ['rating' => 4, 'title' => 'Great value for money', 'body' => 'Very good product for the price. A couple of minor finishing touches could be improved, but overall satisfied.'],
            ['rating' => 4, 'title' => 'Lovely gift choice', 'body' => 'Bought this as a gift and the recipient loved it. The store even included a small thank-you note.'],
            ['rating' => 3, 'title' => 'Decent but not perfect', 'body' => 'Good quality overall, though delivery took a little longer than expected. Product itself is fine.'],
            ['rating' => 5, 'title' => 'Worth every rupee', 'body' => 'Second time ordering from GOSIKA and the consistency is impressive. Fresh, well made, and honestly described.'],
        ];

        $questionTemplates = [
            ['question' => 'Is this handmade or machine made?', 'answer' => 'Thank you for asking — this item is completely handmade by our artisan partners in the Kathmandu valley.'],
            ['question' => 'Do you ship internationally, e.g. to the USA?', 'answer' => 'Currently we ship within Nepal only, but international shipping is on our roadmap. Watch this space!'],
            ['question' => 'What is the estimated delivery time to Pokhara?', 'answer' => 'Orders to Pokhara typically arrive within 2–3 business days via our courier partners.'],
            ['question' => 'Can you share more details about the materials used?', 'answer' => 'Absolutely — the product uses natural, eco-friendly materials sourced from Nepali suppliers. Full specs are listed on the product page.'],
            ['question' => 'Is this product suitable as a festival gift?', 'answer' => null],
            ['question' => 'Are there any size variations available?', 'answer' => null],
            ['question' => 'Can I request a custom engraving?', 'answer' => null],
        ];

        $seedStatuses = [
            ReviewStatus::APPROVED,
            ReviewStatus::APPROVED,
            ReviewStatus::APPROVED,
            ReviewStatus::APPROVED,
            ReviewStatus::PENDING,
            ReviewStatus::PENDING,
            ReviewStatus::REJECTED,
        ];

        foreach ($products as $index => $product) {
            $count = 2 + ($index % 3);

            for ($i = 0; $i < $count; $i++) {
                $reviewer = $reviewers[($index + $i) % count($reviewers)];
                $template = $productReviewTemplates[($index + $i) % count($productReviewTemplates)];
                $status = $seedStatuses[($index + $i) % count($seedStatuses)];

                $review = ProductReview::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $reviewer->id,
                    'product_id' => $product->id,
                    'rating' => $template['rating'],
                    'title' => $template['title'],
                    'body' => $template['body'],
                    'status' => $status,
                    'reviewed_at' => $status === ReviewStatus::PENDING || $status === ReviewStatus::REJECTED ? null : now()->subDays($i + 1),
                ]);

                if ($status === ReviewStatus::APPROVED && ($index + $i) % 3 === 0) {
                    $review->reply = 'Thank you for your wonderful feedback! We are glad you enjoyed the product.';
                    $review->replied_by = $product->vendor?->user_id;
                    $review->replied_at = now()->subDays($i);
                    $review->save();
                }
            }

            $approved = ProductReview::query()
                ->where('product_id', $product->id)
                ->where('status', ReviewStatus::APPROVED)
                ->get();

            if ($approved->isNotEmpty()) {
                $product->update([
                    'rating_avg' => round($approved->avg('rating'), 2),
                    'rating_count' => $approved->count(),
                ]);
            }
        }

        if ($store) {
            $storeReviewTemplates = [
                ['rating' => 5, 'body' => 'Excellent service and genuine products. The team is very responsive on chat.'],
                ['rating' => 4, 'body' => 'Good experience overall. Slight delay in dispatch, but the product quality made up for it.'],
                ['rating' => 5, 'body' => 'My go-to marketplace store for authentic Nepali goods. Highly trusted.'],
                ['rating' => 3, 'body' => 'Products are fine, but I wish packaging was more eco-friendly.'],
                ['rating' => 5, 'body' => 'Fast delivery and beautiful packaging. Will definitely order again.'],
                ['rating' => 4, 'body' => 'Reliable store with fair prices. Customer support resolved my query quickly.'],
            ];

            foreach (array_slice($reviewers, 0, 5) as $i => $reviewer) {
                $tpl = $storeReviewTemplates[$i % count($storeReviewTemplates)];
                StoreReview::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $reviewer->id,
                    'store_id' => $store->id,
                    'rating' => $tpl['rating'],
                    'body' => $tpl['body'],
                    'status' => $i < 3 ? ReviewStatus::APPROVED : ReviewStatus::PENDING,
                    'reviewed_at' => $i < 3 ? now()->subDays($i + 1) : null,
                ]);
            }
        }

        $questionProducts = $products->take(5);

        foreach ($questionProducts as $pIndex => $product) {
            $qCount = 1 + ($pIndex % 2);

            for ($i = 0; $i < $qCount; $i++) {
                $reviewer = $reviewers[($pIndex + $i + 1) % count($reviewers)];
                $tpl = $questionTemplates[($pIndex + $i) % count($questionTemplates)];
                $answered = $tpl['answer'] !== null;

                ProductQuestion::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'product_id' => $product->id,
                    'user_id' => $reviewer->id,
                    'question' => $tpl['question'],
                    'status' => $answered ? ReviewStatus::APPROVED : ReviewStatus::PENDING,
                    'answer' => $tpl['answer'],
                    'answered_at' => $answered ? now()->subDays($i + 1) : null,
                    'answered_by' => $answered ? $product->vendor?->user_id : null,
                    'reviewed_at' => $answered ? now()->subDays($i) : null,
                ]);
            }
        }

        $questionCount = ProductQuestion::query()->count();
        $reviewCount = ProductReview::query()->count() + StoreReview::query()->count();

        $this->command?->info("Seeded {$reviewCount} reviews and {$questionCount} product questions.");
    }
}