<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Static helper ────────────────────────────────────────────────

    /**
     * Enregistre une entrée d'audit.
     *
     * @param string     $action         ex: 'application.status_changed'
     * @param Model      $resource       L'entité concernée
     * @param array      $oldValues      Valeurs avant changement
     * @param array      $newValues      Valeurs après changement
     * @param int|null   $userId         ID de l'auteur (null = système)
     */
    public static function record(
        string $action,
        Model $resource,
        array $oldValues = [],
        array $newValues = [],
        ?int $userId = null,
        ?string $ipAddress = null
    ): static {
        return static::create([
            'user_id'       => $userId ?? auth()->id(),
            'action'        => $action,
            'resource_type' => class_basename($resource),
            'resource_id'   => $resource->getKey(),
            'old_values'    => $oldValues ?: null,
            'new_values'    => $newValues ?: null,
            'ip_address'    => $ipAddress ?? request()?->ip(),
            'user_agent'    => request()?->userAgent(),
        ]);
    }
}
