<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prescreening extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'recruiter_id',
        'decision',
        'comment',
        'decided_at',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
            'locked_at'  => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function recruiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recruiter_id');
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }
}
