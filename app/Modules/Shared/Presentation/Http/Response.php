<?php

namespace App\Modules\Shared\Presentation\Http;

use Illuminate\Http\JsonResponse;

class Response
{
    public static function success(mixed $data = null, string $message = 'Success', array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => $meta,
        ], $status);
    }

    public static function error(string $message = 'An error occurred', array $errors = [], int $status = 400, ?array $data = null): JsonResponse
    {
        if (($message === 'An error occurred' || $message === 'Validation failed.' || $message === 'The given data was invalid.') && ! empty($errors)) {
            $flattened = collect($errors)->flatten()->filter()->values();
            if ($flattened->isNotEmpty()) {
                $message = $flattened->implode(' ');
            }
        }

        $payload = [
            'success' => false,
            'message' => $message,
            'data' => $data,
            'meta' => [],
        ];

        if (! empty($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    public static function created(mixed $data = null, string $message = 'Created successfully'): JsonResponse
    {
        return self::success($data, $message, [], 201);
    }

    public static function noContent(string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => null,
            'meta' => [],
        ], 204);
    }
}
