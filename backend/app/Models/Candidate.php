<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date_naissance',
        'lieu_naissance',
        'nationalite',
        'situation_familiale',
        'sexe',
        'adresse',
        'nni',
        'photo_path',
        'langues',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'langues' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function diplomas(): HasMany
    {
        return $this->hasMany(Diploma::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * État civil minimum pour produire un CV administratif.
     */
    public function hasCivilStatus(): bool
    {
        return filled($this->date_naissance)
            && filled($this->sexe)
            && filled($this->adresse)
            && filled($this->photo_path);
    }
}
