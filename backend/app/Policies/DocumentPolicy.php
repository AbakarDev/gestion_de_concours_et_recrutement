<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('documents.view') || $user->hasPermissionTo('documents.upload');
    }

    public function view(User $user, Document $document): bool
    {
        if ($this->owns($user, $document)) {
            return true;
        }

        if (! $user->hasPermissionTo('documents.view')) {
            return false;
        }

        if ($user->isJuryOnly()) {
            $status = $document->application?->status;
            $value = $status instanceof \App\Enums\ApplicationStatus ? $status->value : $status;

            return in_array($value, ['accepted', 'evaluated'], true);
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('documents.upload');
    }

    public function delete(User $user, Document $document): bool
    {
        return $this->owns($user, $document) || $user->hasPermissionTo('documents.delete');
    }

    private function owns(User $user, Document $document): bool
    {
        if ($document->application && $document->application->user_id === $user->id) {
            return true;
        }

        if ($document->candidate && $document->candidate->user_id === $user->id) {
            return true;
        }

        return false;
    }
}
