<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminLogsController extends Controller
{
    private const LEVELS = ['DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'];

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
    }

    public function index(): JsonResponse
    {
        $files = collect(glob(storage_path('logs/*.log')))
            ->map(fn (string $path) => [
                'name' => basename($path),
                'size' => filesize($path),
                'modified_at' => filemtime($path),
            ])
            ->sortByDesc('modified_at')
            ->values()
            ->all();

        return Response::success($files, 'Log files retrieved.');
    }

    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'string', 'max:120'],
            'lines' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'search' => ['nullable', 'string', 'max:200'],
            'level' => ['nullable', 'string', 'in:'.implode(',', self::LEVELS)],
        ]);

        $name = basename((string) $request->input('file'));
        $path = storage_path('logs/'.$name);

        if (! is_file($path) || ! str_ends_with($name, '.log')) {
            return Response::error('Log file not found.', [], 404);
        }

        $lines = (int) $request->input('lines', 500);
        $level = (string) $request->input('level', '');
        $search = trim((string) $request->input('search', ''));

        $parsed = $this->parse($this->tail($path, max($lines, 1)), $level, $search);

        return Response::success([
            'file' => $name,
            'size' => filesize($path),
            'modified_at' => filemtime($path),
            'total' => count($parsed),
            'lines' => $parsed,
        ], 'Log content retrieved.');
    }

    /** Efficiently read the last `$lines` lines of a file. */
    private function tail(string $path, int $lines): string
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return '';
        }

        $pos = filesize($path);
        $buffer = '';
        $chunk = 8192;

        while ($pos > 0 && $lines > 0) {
            $readSize = min($chunk, $pos);
            fseek($handle, $pos - $readSize);
            $data = fread($handle, $readSize) ?: '';
            $pos -= $readSize;
            $buffer = $data.$buffer;

            if (substr_count($buffer, "\n") >= $lines) {
                break;
            }
        }

        fclose($handle);

        $entries = explode("\n", $buffer);
        $entries = array_slice($entries, -$lines);

        return implode("\n", $entries);
    }

    /** Parse Laravel log text into classified entries with level inheritance. */
    private function parse(string $content, string $levelFilter, string $search): array
    {
        $rawLines = explode("\n", $content);
        $output = [];
        $currentLevel = 'INFO';
        $startLine = 0;

        foreach ($rawLines as $index => $raw) {
            $lineNumber = count($output) + 1;
            $trimmed = rtrim($raw);

            if ($trimmed === '') {
                continue;
            }

            preg_match('/^\[(?<date>[^\]]+)\]\s+(?:[a-z\-]+\.)?(?<level>'.implode('|', self::LEVELS).'):\s*(?<message>.*)$/', $trimmed, $m);

            if (! empty($m)) {
                $currentLevel = $m['level'];
                $startLine = $lineNumber;
                $entry = [
                    'n' => $lineNumber,
                    'level' => $currentLevel,
                    'ts' => isset($m['date']) ? trim($m['date']) : '',
                    'content' => $trimmed,
                ];
            } else {
                $entry = [
                    'n' => $lineNumber,
                    'level' => $currentLevel,
                    'ts' => '',
                    'content' => $trimmed,
                ];
            }

            if ($levelFilter !== '' && strcasecmp($currentLevel, $levelFilter) !== 0) {
                continue;
            }

            if ($search !== '' && ! str_contains($trimmed, $search) && ! str_contains($currentLevel, $search)) {
                continue;
            }

            $output[] = $entry;
        }

        return $output;
    }
}