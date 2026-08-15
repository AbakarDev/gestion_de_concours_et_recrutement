<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Convocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'exam_center_id',
        'salle',
        'exam_date',
        'qr_code',
        'pdf_path',
        'generated_at',
        'generation_count',
    ];

    protected function casts(): array
    {
        return [
            'exam_date'        => 'datetime',
            'generated_at'     => 'datetime',
            'generation_count' => 'integer',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function examCenter(): BelongsTo
    {
        return $this->belongsTo(ExamCenter::class);
    }
}
