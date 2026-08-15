<?php

namespace App\Modules\Support\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\TicketStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use App\Modules\Support\Infrastructure\Models\TicketMessage;
use App\Modules\Support\Presentation\Resources\VendorTicketResource;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class VendorSupportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $tickets = SupportTicket::query()
            ->where('vendor_id', $vendor->id)
            ->with(['user', 'messages'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('priority'), fn ($q, $priority) => $q->where('priority', $priority))
            ->when($request->input('search'), fn ($q, $search) => $q->where(fn ($inner) => $inner->where('ticket_number', 'like', "%{$search}%")->orWhere('subject', 'like', "%{$search}%")))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorTicketResource::collection($tickets),
            'Tickets retrieved.',
            ['pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
            ]]
        );
    }

    public function show(Request $request, string $ticket): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $ticket = SupportTicket::with(['user', 'messages.sender'])
            ->where('uuid', $ticket)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        return Response::success(new VendorTicketResource($ticket), 'Ticket retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $data = $request->validate([
            'subject' => ['required', 'string', 'max:250'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:60'],
            'priority' => ['nullable', 'string', 'in:low,normal,high'],
            'order_id' => ['nullable', 'uuid', 'exists:orders,uuid'],
            'vendor_order_id' => ['nullable', 'uuid', 'exists:vendor_orders,uuid'],
            'attachments' => ['array'],
        ]);

        $ticket = SupportTicket::create([
            'ticket_number' => 'TCK-'.strtoupper(Str::random(8)),
            'user_id' => $request->user()->id,
            'vendor_id' => $vendor->id,
            'order_id' => $data['order_id'] ? Order::where('uuid', $data['order_id'])->value('id') : null,
            'vendor_order_id' => $data['vendor_order_id'] ? VendorOrder::where('uuid', $data['vendor_order_id'])->value('id') : null,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'category' => $data['category'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
            'status' => TicketStatus::OPEN,
            'meta' => ['attachments' => $request->input('attachments', [])],
        ]);

        return Response::created(new VendorTicketResource($ticket->load('user', 'messages')), 'Ticket created.');
    }

    public function message(Request $request, string $ticket): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $ticket = $this->ticketForVendor($vendor, $ticket);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array'],
        ]);

        TicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_user_id' => $request->user()->id,
            'message' => $data['message'],
            'is_internal' => false,
            'attachments' => $data['attachments'] ?? [],
        ]);

        if ($ticket->status === TicketStatus::CLOSED) {
            $ticket->status = TicketStatus::OPEN;
            $ticket->save();
        }

        return Response::created(new VendorTicketResource($ticket->load('user', 'messages.sender')), 'Message sent.');
    }

    public function close(Request $request, string $ticket): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $ticket = $this->ticketForVendor($vendor, $ticket);

        $ticket->status = TicketStatus::CLOSED;
        $ticket->resolved_at = now();
        $ticket->save();

        return Response::success(new VendorTicketResource($ticket->load('user', 'messages.sender')), 'Ticket closed.');
    }

    public function reopen(Request $request, string $ticket): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $ticket = $this->ticketForVendor($vendor, $ticket);

        $ticket->status = TicketStatus::OPEN;
        $ticket->resolved_at = null;
        $ticket->save();

        return Response::success(new VendorTicketResource($ticket->load('user', 'messages.sender')), 'Ticket reopened.');
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access support.', 403);
        }

        return $vendor;
    }

    protected function ticketForVendor(Vendor $vendor, string $uuid): SupportTicket
    {
        $ticket = SupportTicket::where('uuid', $uuid)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (! $ticket) {
            throw new DomainException('Ticket not found for this vendor.', 403);
        }

        return $ticket;
    }
}
