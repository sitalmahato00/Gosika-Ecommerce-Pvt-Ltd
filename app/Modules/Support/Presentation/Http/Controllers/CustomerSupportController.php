<?php

namespace App\Modules\Support\Presentation\Http\Controllers;

use App\Modules\Shared\Domain\Enums\TicketStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use App\Modules\Support\Infrastructure\Models\TicketMessage;
use App\Modules\Support\Presentation\Resources\TicketResource;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CustomerSupportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'vendor',
                'order',
                'messages' => fn ($query) => $query->where('is_internal', false)->with('sender'),
            ])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            TicketResource::collection($tickets),
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
        $item = SupportTicket::with([
            'user',
            'vendor',
            'order',
            'messages' => fn ($query) => $query->where('is_internal', false)->with('sender'),
        ])
            ->where('uuid', $ticket)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return Response::success(new TicketResource($item), 'Ticket retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:250'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:60'],
            'priority' => ['nullable', 'string', 'in:low,normal,high'],
            'store_id' => [
                'nullable',
                'uuid',
                Rule::exists('stores', 'uuid')->where('status', StoreStatus::ACTIVE->value),
            ],
            'attachments' => ['nullable', 'array'],
        ]);

        $store = isset($data['store_id'])
            ? Store::query()->where('uuid', $data['store_id'])->where('status', StoreStatus::ACTIVE)->firstOrFail()
            : null;

        $ticket = SupportTicket::create([
            'ticket_number' => 'TCK-'.strtoupper(Str::random(8)),
            'user_id' => $request->user()->id,
            'vendor_id' => $store?->vendor_id,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'category' => $data['category'] ?? ($store ? 'Store Message' : 'General'),
            'priority' => $data['priority'] ?? 'normal',
            'status' => TicketStatus::OPEN,
            'meta' => ['attachments' => $request->input('attachments', [])],
        ]);

        TicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_user_id' => $request->user()->id,
            'message' => $data['description'],
            'is_internal' => false,
            'attachments' => $data['attachments'] ?? [],
        ]);

        return Response::created(new TicketResource($ticket->load([
            'user',
            'vendor',
            'messages' => fn ($query) => $query->where('is_internal', false)->with('sender'),
        ])), 'Message thread created.');
    }

    public function message(Request $request, string $ticket): JsonResponse
    {
        $ticket = SupportTicket::where('uuid', $ticket)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

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
        $ticket->touch();

        if ($ticket->status === TicketStatus::CLOSED) {
            $ticket->status = TicketStatus::OPEN;
            $ticket->save();
        }

        return Response::created(new TicketResource($ticket->load([
            'user',
            'vendor',
            'messages' => fn ($query) => $query->where('is_internal', false)->with('sender'),
        ])), 'Message sent.');
    }

    public function close(Request $request, string $ticket): JsonResponse
    {
        $ticket = SupportTicket::where('uuid', $ticket)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $ticket->status = TicketStatus::CLOSED;
        $ticket->resolved_at = now();
        $ticket->save();

        return Response::success(new TicketResource($ticket->load([
            'user',
            'vendor',
            'messages' => fn ($query) => $query->where('is_internal', false)->with('sender'),
        ])), 'Ticket closed.');
    }
}
