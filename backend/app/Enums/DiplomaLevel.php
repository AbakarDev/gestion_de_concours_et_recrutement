<?php

namespace App\Enums;

/** Niveaux reconnus pour un dossier de la fonction publique. */
enum DiplomaLevel: string
{
    case Cepe = 'CEPE';
    case Bepc = 'BEPC';
    case Bac = 'BAC';
    case Bts = 'BTS';
    case Dut = 'DUT';
    case Licence = 'Licence';
    case Master = 'Master';
    case Doctorat = 'Doctorat';
    case Professionnel = 'Diplôme professionnel';
    case Autre = 'Autre';

    public function label(): string
    {
        return $this->value;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
