<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Messaging\Infrastructure\Models\ChatConversation;
use App\Modules\Messaging\Infrastructure\Models\ChatMessage;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConversationMessagingTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_start_a_store_chat_and_vendor_and_admin_can_reply_in_it(): void
    {
        Role::findOrCreate(Roles::CUSTOMER, 'web');
        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $adminRole = Role::findOrCreate('support_agent', 'web');
        $permission = Permission::findOrCreate('tickets.view', 'web');
        $adminRole->givePermissionTo($permission);

        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);
        $vendorUser = User::factory()->create();
        $vendorUser->assignRole(Roles::VENDOR_ADMIN);
        $vendor = Vendor::query()->create([
            'user_id' => $vendorUser->id,
            'company_name' => 'Chat Store Vendor',
            'business_email' => 'chat-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Chat Store',
            'slug' => 'chat-store',
            'status' => 'active',
        ]);
        $admin = User::factory()->create();
        $admin->assignRole($adminRole);
        $originalBroadcaster = $this->configureBroadcasting();

        $this->actingAs($customer)
            ->postJson('/api/v1/customer/conversations', [
                'type' => 'store',
                'store_id' => $store->uuid,
            ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'store')
            ->assertJsonPath('data.store_name', 'Chat Store');

        $conversation = ChatConversation::query()->firstOrFail();

        $channelAuth = [
            'socket_id' => '123.456',
            'channel_name' => 'private-chat.conversation.'.$conversation->uuid,
        ];

        $this->actingAs($customer)->postJson('/broadcasting/auth', $channelAuth)->assertOk();
        $this->actingAs($vendorUser)->postJson('/broadcasting/auth', $channelAuth)->assertOk();
        $this->actingAs($admin)->postJson('/broadcasting/auth', $channelAuth)->assertOk();
        config(['broadcasting.default' => $originalBroadcaster]);

        $this->actingAs($vendorUser)
            ->getJson('/api/v1/vendor/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.id', $conversation->uuid);

        $this->actingAs($vendorUser)
            ->postJson('/api/v1/vendor/conversations/'.$conversation->uuid.'/messages', [
                'message' => 'Yes, this is available.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.message.message', 'Yes, this is available.');

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/conversations/'.$conversation->uuid.'/messages', [
                'message' => 'Our team can help too.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.message.message', 'Our team can help too.');

        $this->actingAs($customer)
            ->getJson('/api/v1/customer/conversations/'.$conversation->uuid)
            ->assertOk()
            ->assertJsonPath('data.messages.0.message', 'Yes, this is available.')
            ->assertJsonPath('data.messages.1.message', 'Our team can help too.');
    }

    public function test_customers_cannot_read_other_customers_conversations_and_inactive_stores_cannot_be_chatted(): void
    {
        Role::findOrCreate(Roles::CUSTOMER, 'web');
        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);
        $otherCustomer = User::factory()->create();
        $otherCustomer->assignRole(Roles::CUSTOMER);
        $vendor = Vendor::query()->create([
            'user_id' => User::factory()->create()->id,
            'company_name' => 'Inactive Chat Vendor',
            'business_email' => 'inactive-chat-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Inactive Chat Store',
            'slug' => 'inactive-chat-store',
            'status' => 'suspended',
        ]);

        $conversation = ChatConversation::query()->create([
            'conversation_key' => 'support-'.$otherCustomer->id.'-gosika',
            'type' => 'support',
            'customer_user_id' => $otherCustomer->id,
            'subject' => 'GOSIKA Support',
        ]);
        $this->configureBroadcasting();

        $this->actingAs($customer)
            ->getJson('/api/v1/customer/conversations/'.$conversation->uuid)
            ->assertNotFound();

        $this->actingAs($customer)
            ->postJson('/broadcasting/auth', [
                'socket_id' => '123.456',
                'channel_name' => 'private-chat.conversation.'.$conversation->uuid,
            ])
            ->assertForbidden();

        $this->actingAs($customer)
            ->postJson('/api/v1/customer/conversations', [
                'type' => 'store',
                'store_id' => $store->uuid,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['store_id']);
    }

    public function test_customer_can_send_image_only_messages_and_image_urls_are_returned(): void
    {
        Role::findOrCreate(Roles::CUSTOMER, 'web');
        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);
        $conversation = ChatConversation::query()->create([
            'conversation_key' => 'support-'.$customer->id.'-gosika',
            'type' => 'support',
            'customer_user_id' => $customer->id,
            'subject' => 'GOSIKA Support',
        ]);
        Storage::fake('local');

        $response = $this->actingAs($customer)->post(
            '/api/v1/customer/conversations/'.$conversation->uuid.'/messages',
            [
                'client_uuid' => '987d4b8d-4564-4a70-9807-0c7fb487a1bc',
                'images' => [UploadedFile::fake()->image('product.png')],
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertCreated()
            ->assertJsonPath('data.message.message', '')
            ->assertJsonPath('data.message.client_uuid', '987d4b8d-4564-4a70-9807-0c7fb487a1bc')
            ->assertJsonPath('data.message.images.0', url(
                '/api/v1/conversations/'.$conversation->uuid.'/messages/'.$response->json('data.message.id').'/images/0'
            ));

        $this->assertDatabaseHas('chat_messages', [
            'chat_conversation_id' => $conversation->id,
            'message' => '',
        ]);
        $imageUrl = $response->json('data.message.images.0');
        $imagePath = parse_url($imageUrl, PHP_URL_PATH);
        $imageResponse = $this->actingAs($customer)->get($imagePath);
        $imageResponse->assertOk();
        $this->assertStringContainsString('private', (string) $imageResponse->headers->get('Cache-Control'));
        $storedMessage = ChatMessage::query()->where('uuid', $response->json('data.message.id'))->firstOrFail();
        Storage::disk('local')->assertExists($storedMessage->images[0]);

        $otherCustomer = User::factory()->create();
        $otherCustomer->assignRole(Roles::CUSTOMER);
        $this->actingAs($otherCustomer)->get($imagePath)->assertNotFound();
    }

    public function test_legacy_public_chat_images_remain_available_through_the_authorized_route(): void
    {
        Role::findOrCreate(Roles::CUSTOMER, 'web');
        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);
        $conversation = ChatConversation::query()->create([
            'conversation_key' => 'support-'.$customer->id.'-gosika',
            'type' => 'support',
            'customer_user_id' => $customer->id,
            'subject' => 'GOSIKA Support',
        ]);
        Storage::fake('public');
        $legacyPath = 'chat/'.$conversation->uuid.'/legacy.png';
        Storage::disk('public')->put($legacyPath, UploadedFile::fake()->image('legacy.png')->getContent());
        $message = $conversation->messages()->create([
            'sender_user_id' => $customer->id,
            'message' => '',
            'images' => [$legacyPath],
        ]);

        $this->actingAs($customer)
            ->get('/api/v1/conversations/'.$conversation->uuid.'/messages/'.$message->uuid.'/images/0')
            ->assertOk();
    }

    private function configureBroadcasting(): string
    {
        $originalBroadcaster = config('broadcasting.default') ?: 'null';

        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app',
            'broadcasting.connections.reverb.options.host' => 'localhost',
            'broadcasting.connections.reverb.options.port' => 8080,
            'broadcasting.connections.reverb.options.scheme' => 'http',
            'broadcasting.connections.reverb.options.useTLS' => false,
        ]);

        require base_path('routes/channels.php');

        return $originalBroadcaster;
    }
}
