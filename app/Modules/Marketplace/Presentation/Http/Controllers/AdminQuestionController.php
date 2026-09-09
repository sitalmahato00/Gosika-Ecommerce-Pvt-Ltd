<?php

namespace App\Modules\Marketplace\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketplace\Infrastructure\Models\ProductQuestion;
use App\Modules\Marketplace\Presentation\Resources\AdminQuestionResource;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminQuestionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::PRODUCTS_APPROVE.'|'.Permissions::STORES_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $questions = ProductQuestion::query()
            ->with(['user', 'product.primaryImage', 'answeredBy'])
            ->when($request->filled('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->filled('search'), fn ($q, $s) => $q->where('question', 'like', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate((int) $request->integer('per_page', 15));

        return Response::success(AdminQuestionResource::collection($questions), 'Questions retrieved.', [
            'pagination' => [
                'total' => $questions->total(),
                'per_page' => $questions->perPage(),
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
            ],
        ]);
    }

    public function answer(Request $request, string $questionId): JsonResponse
    {
        $validated = $request->validate([
            'answer' => ['required', 'string', 'max:1000'],
        ]);

        $question = $this->resolve($questionId);
        $question->answer = $validated['answer'];
        $question->answered_by = $request->user()->id;
        $question->answered_at = now();
        $question->status = ReviewStatus::APPROVED;
        $question->reviewed_by = $request->user()->id;
        $question->reviewed_at = now();
        $question->save();

        app(AuditLogService::class)->record(
            $request->user(),
            'question.answered',
            'product_question',
            $question->uuid,
            null,
            ['status' => 'approved', 'question' => $validated['answer']]
        );

        return Response::success(new AdminQuestionResource($question->load(['user', 'product.primaryImage', 'answeredBy'])), 'Answer published.');
    }

    public function approve(Request $request, string $questionId): JsonResponse
    {
        $question = $this->resolve($questionId);
        $question->status = ReviewStatus::APPROVED;
        $question->reviewed_by = $request->user()->id;
        $question->reviewed_at = now();
        $question->save();

        app(AuditLogService::class)->record($request->user(), 'question.approved', 'product_question', $question->uuid, ['status' => 'pending'], ['status' => 'approved']);

        return Response::success(new AdminQuestionResource($question->load(['user', 'product.primaryImage', 'answeredBy'])), 'Question approved.');
    }

    public function reject(Request $request, string $questionId): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $question = $this->resolve($questionId);
        $question->status = ReviewStatus::REJECTED;
        $question->reviewed_by = $request->user()->id;
        $question->reviewed_at = now();
        $question->save();

        app(AuditLogService::class)->record($request->user(), 'question.rejected', 'product_question', $question->uuid, ['status' => 'pending'], ['status' => 'rejected', 'reason' => $request->input('reason')]);

        return Response::success(new AdminQuestionResource($question->load(['user', 'product.primaryImage', 'answeredBy'])), 'Question rejected.');
    }

    public function destroy(Request $request, string $questionId): JsonResponse
    {
        $question = $this->resolve($questionId);
        app(AuditLogService::class)->record($request->user(), 'question.deleted', 'product_question', $question->uuid, null, []);
        $question->delete();

        return Response::success(null, 'Question deleted.');
    }

    protected function resolve(string $questionId): ProductQuestion
    {
        $question = ProductQuestion::query()->where('uuid', $questionId)->first();

        if (! $question) {
            throw new DomainException('Question not found.', 404);
        }

        return $question;
    }
}