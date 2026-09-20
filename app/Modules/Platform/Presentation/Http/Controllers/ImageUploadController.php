<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class ImageUploadController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function upload(Request $request): JsonResponse
    {
        $file = $request->file('image') ?: $request->file('file');

        if (! $file) {
            return Response::error('No image file was provided for upload.', [], 422);
        }

        $request->validate([
            'image' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp,svg,gif', 'max:10240'],
            'file'  => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp,svg,gif', 'max:10240'],
            'folder' => ['nullable', 'string', 'max:50', 'regex:/^[a-zA-Z0-9_\-\/]+$/'],
        ]);

        $folder = $request->input('folder', 'general');
        $cleanFolder = trim(preg_replace('/[^a-zA-Z0-9_\-]/', '', $folder)) ?: 'general';

        $filename = Str::uuid()->toString() . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $path = $file->storeAs('uploads/' . $cleanFolder, $filename, 'public');

        $url = '/storage/' . $path;

        return Response::success([
            'url' => $url,
            'path' => $path,
            'filename' => $filename,
        ], 'Image uploaded successfully.');
    }
}
