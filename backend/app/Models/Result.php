<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'moyenne',
        'rang',
        'decision',
        'is_admitted',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'moyenne'    => 'decimal:2',
            'is_admitted' => 'boolean',
            'locked_at'  => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }
}
