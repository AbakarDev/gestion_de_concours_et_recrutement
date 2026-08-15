<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;
    
    protected $fillable = ['user_id', 'date_naissance', 'sexe', 'adresse', 'nni'];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
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
    
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
