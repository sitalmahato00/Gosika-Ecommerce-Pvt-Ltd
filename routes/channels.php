<?php

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Messaging\Infrastructure\Models\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.conversation.{conversationUuid}', function (User $user, string $conversationUuid): bool {
    $conversation = ChatConversation::query()->where('uuid', $conversationUuid)->first();

    if (! $conversation) {
        return false;
    }

    $roleNames = $user->getRoleNames();
    $isAdmin = $roleNames->contains(Roles::SUPER_ADMIN)
        || $roleNames->diff([
            Roles::CUSTOMER,
            Roles::VENDOR_ADMIN,
            Roles::DELIVERY_PARTNER,
            'vendor',
            'delivery',
        ])->isNotEmpty();
    $vendor = $user->vendor;
    $isVendor = $roleNames->contains(Roles::VENDOR_ADMIN)
        || $roleNames->contains('vendor')
        || $vendor !== null;
    $isDeliveryPartner = $roleNames->contains(Roles::DELIVERY_PARTNER)
        || $roleNames->contains('delivery')
        || $user->deliveryPartner !== null;
    $isCustomer = $roleNames->contains(Roles::CUSTOMER)
        && ! $isAdmin
        && ! $isVendor
        && ! $isDeliveryPartner;

    return ($isCustomer && $conversation->customer_user_id === $user->id)
        || (! $isAdmin && $isVendor && $vendor && $conversation->vendor_id === $vendor->id)
        || ($isAdmin && $user->hasPermissionTo('tickets.view'));
});
