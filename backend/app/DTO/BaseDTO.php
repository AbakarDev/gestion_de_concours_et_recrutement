<?php

namespace App\DTO;

use Illuminate\Http\Request;

abstract class BaseDTO
{
    /**
     * Crée une instance du DTO à partir d'une requête HTTP.
     *
     * @param Request $request
     * @return static
     */
    abstract public static function fromRequest(Request $request): self;

    /**
     * Crée une instance du DTO à partir d'un tableau de données.
     *
     * @param array $data
     * @return static
     */
    abstract public static function fromArray(array $data): self;

    /**
     * Convertit le DTO en tableau (utile pour les insertions Eloquent).
     *
     * @return array
     */
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
