<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamCenter extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'ville', 'capacite'];

    public function getNameAttribute(): ?string
    {
        return $this->attributes['nom'] ?? null;
    }
}
