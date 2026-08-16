<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $user = $request->user();
        $query = Document::query();

        if ($user->isJuryOnly()) {
            $query->whereHas('application', function ($q) {
                $q->whereIn('status', ['accepted', 'evaluated']);
            });
        } else {
            $query->with(['application', 'candidate']);
        }

        if (! $user->isStaff()) {
            $candidateId = $user->candidate?->id;
            $query->where(function ($q) use ($user, $candidateId) {
                if ($candidateId) {
                    $q->where('candidate_id', $candidateId);
                }
                $q->orWhereHas('application', function ($appQuery) use ($user) {
                    $appQuery->where('user_id', $user->id);
                });
            });
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => DocumentResource::collection($documents),
        ]);
    }

    public function upload(Request $request)
    {
        $this->authorize('create', Document::class);

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'type' => 'required|string',
            'application_id' => 'nullable|exists:applications,id'
        ]);

        $type = \App\Enums\DocumentType::fromLegacy((string) $request->type);
        if (! $type || $type->isGenerated()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Type de pièce non reconnu. Utilisez le catalogue ministériel (CNI, diplôme, casier, etc.). Le CV et la lettre sont générés par le système.',
            ], 422);
        }

        $user = $request->user();
        $candidate = app(\App\Actions\EnsureCandidateProfileAction::class)->execute($user);

        if ($request->application_id) {
            $application = \App\Models\Application::findOrFail($request->application_id);
            if ($application->user_id !== $user->id && ! $user->isStaff()) {
                return response()->json(['status' => 'error', 'message' => 'Accès refusé.'], 403);
            }
        }

        $path = $request->file('file')->store('documents', 'public');

        if ($type === \App\Enums\DocumentType::PhotoIdentite) {
            $candidate->update(['photo_path' => $path]);
        }

        $document = Document::create([
            'candidate_id' => $candidate->id,
            'application_id' => $request->application_id,
            'type' => $type->value,
            'path' => $path,
            'status' => 'en attente'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Document téléversé avec succès',
            'data' => $document
        ], 201);
    }

    public function view(string $id)
    {
        $document = Document::with(['application', 'candidate'])->findOrFail($id);
        $this->authorize('view', $document);

        if (!Storage::disk('public')->exists($document->path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Fichier introuvable sur le serveur.'
            ], 404);
        }

        $fullPath = Storage::disk('public')->path($document->path);
        $mimeType = Storage::disk('public')->mimeType($document->path);

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . basename($document->path) . '"'
        ]);
    }

    public function download(string $id)
    {
        $document = Document::with(['application', 'candidate'])->findOrFail($id);
        $this->authorize('view', $document);

        if (!Storage::disk('public')->exists($document->path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Fichier introuvable sur le serveur.'
            ], 404);
        }

        $extension = pathinfo($document->path, PATHINFO_EXTENSION);
        $downloadName = sprintf('%s_%s.%s', str_replace(' ', '_', $document->type), $document->id, $extension);

        return Storage::disk('public')->download($document->path, $downloadName);
    }

    public function destroy(string $id)
    {
        $document = Document::with(['application', 'candidate'])->findOrFail($id);
        $this->authorize('delete', $document);

        if ($document->path && Storage::disk('public')->exists($document->path)) {
            Storage::disk('public')->delete($document->path);
        }

        $document->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Document supprimé avec succès.'
        ]);
    }
}
