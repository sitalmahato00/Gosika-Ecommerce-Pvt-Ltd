<?php

namespace App\Modules\Support\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Enums\TicketStatus;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use App\Modules\Support\Infrastructure\Models\TicketMessage;
use App\Modules\Support\Presentation\Resources\TicketResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class AdminSupportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::TICKETS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::query()
            ->with(['user', 'assignee', 'vendor'])
            ->when($request->input('channel') === 'vendor', fn ($q) => $q->whereNotNull('vendor_id'))
            ->when($request->input('channel') === 'customer', fn ($q) => $q->whereNull('vendor_id'))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('priority'), fn ($q, $s) => $q->where('priority', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
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

    public function show(string $ticketId): JsonResponse
    {
        $ticket = SupportTicket::query()
            ->with(['user', 'assignee', 'order', 'vendor', 'messages.sender'])
            ->where('uuid', $ticketId)
            ->firstOrFail();

        return Response::success(new TicketResource($ticket), 'Ticket retrieved.');
    }

    public function reply(Request $request, string $ticketId): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'is_internal' => ['boolean'],
        ]);

        $ticket = SupportTicket::where('uuid', $ticketId)->firstOrFail();

        $message = TicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_user_id' => $request->user()->id,
            'message' => $data['message'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        if ($ticket->status === TicketStatus::CLOSED) {
            $ticket->status = TicketStatus::OPEN;
            $ticket->save();
        }

        return Response::created(new TicketResource($ticket->load('messages.sender', 'user', 'assignee')), 'Reply sent.');
    }

    public function close(Request $request, string $ticketId): JsonResponse
    {
        $request->validate([
            'resolution' => ['nullable', 'string', 'max:1000'],
        ]);

        $ticket = SupportTicket::where('uuid', $ticketId)->firstOrFail();
        $ticket->status = TicketStatus::CLOSED;
        $ticket->resolved_at = now();
        $ticket->save();

        if ($request->input('resolution')) {
            TicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'sender_user_id' => $request->user()->id,
                'message' => 'Resolved: '.$request->input('resolution'),
                'is_internal' => true,
            ]);
        }

        app(AuditLogService::class)->record($request->user(), 'ticket.closed', 'ticket', $ticket->uuid, ['status' => $ticket->status->value], ['status' => 'closed']);

        return Response::success(new TicketResource($ticket->load('user', 'assignee')), 'Ticket closed.');
    }

    public function assign(Request $request, string $ticketId): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,uuid'],
        ]);

        $ticket = SupportTicket::where('uuid', $ticketId)->firstOrFail();

        $assignee = \App\Modules\Identity\Infrastructure\Models\User::where('uuid', $request->input('user_id'))->firstOrFail();
        $ticket->assigned_to = $assignee->id;
        $ticket->save();

        app(AuditLogService::class)->record($request->user(), 'ticket.assigned', 'ticket', $ticket->uuid, null, ['assignee' => $assignee->email]);

        return Response::success(new TicketResource($ticket->load('user', 'assignee')), 'Ticket assigned.');
    }
}
