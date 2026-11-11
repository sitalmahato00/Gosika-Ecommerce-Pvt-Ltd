<?php

namespace App\Modules\Messaging\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Messaging\Infrastructure\Models\ChatConversation;
use App\Modules\Messaging\Infrastructure\Models\ChatMessage;
use App\Modules\Messaging\Presentation\Resources\ChatConversationResource;
use App\Modules\Messaging\Presentation\Resources\ChatMessageResource;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConversationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function customerIndex(Request $request): JsonResponse
    {
        $conversations = $this->forCustomer($request->user())
            ->with(['customer', 'vendor', 'store', 'latestMessage.sender', 'latestMessage.conversation'])
            ->withCount(['messages as unread_count' => fn (Builder $query) => $query
                ->where('sender_user_id', '!=', $request->user()->id)
                ->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->paginate(100);

        return Response::success(
            ChatConversationResource::collection($conversations),
            'Conversations retrieved.',
            ['pagination' => [
                'total' => $conversations->total(),
                'per_page' => $conversations->perPage(),
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
            ]]
        );
    }

    public function customerCreate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['support', 'store'])],
            'store_id' => [
                Rule::requiredIf($request->input('type') === 'store'),
                'nullable',
                'uuid',
                Rule::exists('stores', 'uuid')->where('status', StoreStatus::ACTIVE->value),
            ],
            'subject' => ['nullable', 'string', 'max:250'],
        ]);

        $user = $request->user();
        $store = $data['type'] === 'store'
            ? Store::query()->where('uuid', $data['store_id'])->where('status', StoreStatus::ACTIVE)->firstOrFail()
            : null;
        $key = $data['type'].'-'.$user->id.'-'.($store?->id ?? 'gosika');

        $conversation = ChatConversation::query()->firstOrCreate(
            ['conversation_key' => $key],
            [
                'type' => $data['type'],
                'customer_user_id' => $user->id,
                'vendor_id' => $store?->vendor_id,
                'store_id' => $store?->id,
                'subject' => $data['subject'] ?? ($store ? 'Message '.$store->name : 'GOSIKA Support'),
            ]
        );

        return Response::created(
            new ChatConversationResource($this->loadConversation($conversation, $user)),
            'Conversation opened.'
        );
    }

    public function customerShow(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'customer');
        $this->markRead($item, $request->user());

        return Response::success(new ChatConversationResource($this->loadConversation($item, $request->user())), 'Conversation retrieved.');
    }

    public function customerSend(Request $request, string $conversation): JsonResponse
    {
        return $this->send($request, $this->conversationFor($request, $conversation, 'customer'));
    }

    public function customerRead(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'customer');
        $this->markRead($item, $request->user());

        return Response::success(null, 'Messages marked as read.');
    }

    public function vendorIndex(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request->user());
        $conversations = ChatConversation::query()
            ->where('vendor_id', $vendor->id)
            ->with(['customer', 'vendor', 'store', 'latestMessage.sender', 'latestMessage.conversation'])
            ->withCount(['messages as unread_count' => fn (Builder $query) => $query
                ->where('sender_user_id', '!=', $request->user()->id)
                ->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->paginate(100);

        return Response::success(ChatConversationResource::collection($conversations), 'Conversations retrieved.');
    }

    public function vendorShow(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'vendor');
        $this->markRead($item, $request->user());

        return Response::success(new ChatConversationResource($this->loadConversation($item, $request->user())), 'Conversation retrieved.');
    }

    public function vendorSend(Request $request, string $conversation): JsonResponse
    {
        return $this->send($request, $this->conversationFor($request, $conversation, 'vendor'));
    }

    public function vendorRead(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'vendor');
        $this->markRead($item, $request->user());

        return Response::success(null, 'Messages marked as read.');
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $conversations = ChatConversation::query()
            ->with(['customer', 'vendor', 'store', 'latestMessage.sender', 'latestMessage.conversation'])
            ->withCount(['messages as unread_count' => fn (Builder $query) => $query
                ->where('sender_user_id', '!=', $request->user()->id)
                ->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->paginate(100);

        return Response::success(ChatConversationResource::collection($conversations), 'Conversations retrieved.');
    }

    public function adminShow(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'admin');
        $this->markRead($item, $request->user());

        return Response::success(new ChatConversationResource($this->loadConversation($item, $request->user())), 'Conversation retrieved.');
    }

    public function adminSend(Request $request, string $conversation): JsonResponse
    {
        return $this->send($request, $this->conversationFor($request, $conversation, 'admin'));
    }

    public function adminRead(Request $request, string $conversation): JsonResponse
    {
        $item = $this->conversationFor($request, $conversation, 'admin');
        $this->markRead($item, $request->user());

        return Response::success(null, 'Messages marked as read.');
    }

    public function image(Request $request, string $conversation, string $message, int $index): StreamedResponse
    {
        $portal = $this->portalFor($request->user());
        abort_unless($portal, 404);

        $conversation = $this->conversationFor($request, $conversation, $portal);
        $chatMessage = $conversation->messages()->where('uuid', $message)->firstOrFail();
        $path = $chatMessage->images[$index] ?? null;
        $disk = match (true) {
            $path && Storage::disk('local')->exists($path) => 'local',
            $path && Storage::disk('public')->exists($path) => 'public',
            default => null,
        };
        abort_unless($disk, 404);

        return Storage::disk($disk)->response($path, basename($path), [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    protected function send(Request $request, ChatConversation $conversation): JsonResponse
    {
        $request->merge(['message' => trim((string) $request->input('message', ''))]);
        $data = $request->validate([
            'client_uuid' => ['nullable', 'uuid'],
            'message' => ['nullable', 'string', 'max:5000', 'required_without:images'],
            'images' => ['nullable', 'array', 'max:5', 'required_without:message'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $storedImages = [];
        try {
            foreach ($request->file('images', []) as $image) {
                $path = $image->store('chat/'.$conversation->uuid, 'local');
                if (! $path) {
                    throw new \RuntimeException('A chat image could not be stored.');
                }
                $storedImages[] = $path;
            }

            $message = DB::transaction(function () use ($request, $conversation, $data, $storedImages) {
                $message = $conversation->messages()->create([
                    'sender_user_id' => $request->user()->id,
                    'message' => $data['message'] ?: '',
                    'images' => $storedImages,
                ]);

                $conversation->forceFill(['last_message_at' => $message->created_at])->save();

                return $message;
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($storedImages);
            throw $exception;
        }

        $message->load(['sender', 'conversation']);
        $message->setAttribute('client_uuid', $data['client_uuid'] ?? null);
        $message->setAttribute('conversation_uuid', $conversation->uuid);

        return Response::created([
            'conversation' => (new ChatConversationResource($this->loadConversation($conversation, $request->user())))->resolve($request),
            'message' => (new ChatMessageResource($message))->resolve($request),
        ], 'Message sent.');
    }

    protected function loadConversation(ChatConversation $conversation, User $user): ChatConversation
    {
        $conversation->load(['customer', 'vendor', 'store', 'latestMessage.sender', 'latestMessage.conversation']);
        $messages = $conversation->messages()
            ->with(['sender', 'conversation'])
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->reverse()
            ->values();

        $conversation->setRelation('messages', $messages);
        $conversation->setAttribute('unread_count', $conversation->messages
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count());

        return $conversation;
    }

    protected function markRead(ChatConversation $conversation, User $user): void
    {
        $conversation->messages()
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    protected function conversationFor(Request $request, string $uuid, string $portal): ChatConversation
    {
        $query = ($portal === 'admin' ? ChatConversation::query() : $this->queryConversations($request->user()))
            ->where('uuid', $uuid);

        if ($portal === 'vendor') {
            $query->where('vendor_id', $this->vendorFor($request->user())->id);
        }

        $conversation = $query->first();

        abort_unless($conversation && ($portal !== 'customer' || $conversation->customer_user_id === $request->user()->id), 404);

        return $conversation;
    }

    protected function queryConversations(User $user): Builder
    {
        return ChatConversation::query()->where(function (Builder $query) use ($user) {
            $query->where('customer_user_id', $user->id);

            if ($user->hasRole(Roles::VENDOR_ADMIN) && $user->vendor) {
                $query->orWhere('vendor_id', $user->vendor->id);
            }
        });
    }

    protected function forCustomer(User $user): Builder
    {
        return ChatConversation::query()->where('customer_user_id', $user->id);
    }

    protected function vendorFor(User $user): Vendor
    {
        $vendor = $user->vendor;
        abort_unless($vendor, 403, 'A vendor account is required to view store conversations.');

        return $vendor;
    }

    protected function portalFor(User $user): ?string
    {
        $roleNames = $user->getRoleNames();
        $isAdmin = $roleNames->contains(Roles::SUPER_ADMIN)
            || $roleNames->diff([
                Roles::CUSTOMER,
                Roles::VENDOR_ADMIN,
                Roles::DELIVERY_PARTNER,
                'vendor',
                'delivery',
            ])->isNotEmpty();
        if ($isAdmin) {
            return $user->hasPermissionTo('tickets.view') ? 'admin' : null;
        }

        $isVendor = $roleNames->contains(Roles::VENDOR_ADMIN)
            || $roleNames->contains('vendor')
            || $user->vendor !== null;
        if ($isVendor) {
            return 'vendor';
        }

        $isDeliveryPartner = $roleNames->contains(Roles::DELIVERY_PARTNER)
            || $roleNames->contains('delivery')
            || $user->deliveryPartner !== null;

        return $roleNames->contains(Roles::CUSTOMER) && ! $isDeliveryPartner
            ? 'customer'
            : null;
    }
}
