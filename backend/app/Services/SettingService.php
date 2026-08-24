<?php

namespace App\Services;

use App\Models\PlatformSetting;

class SettingService
{
    /** @var array<string, string> */
    public const DEFAULTS = [
        'platform_name' => 'Portail Concours et Recrutements Tchad',
        'platform_subtitle' => 'Plateforme web et mobile pour la gestion des concours et des recrutements au Tchad',
        'contact_email' => 'contact@recrute.td',
        'contact_phone' => '+235 22 51 00 00',
        'support_message' => 'Pour toute assistance, contactez la Direction des concours.',
        'registration_enabled' => '1',
        'payment_mock_enabled' => '1',
    ];

    public function all(): array
    {
        $this->ensureDefaults();

        return PlatformSetting::query()->pluck('value', 'key')->all();
    }

    public function public(): array
    {
        $all = $this->all();

        return [
            'platform_name' => $all['platform_name'] ?? self::DEFAULTS['platform_name'],
            'platform_subtitle' => $all['platform_subtitle'] ?? self::DEFAULTS['platform_subtitle'],
            'contact_email' => $all['contact_email'] ?? self::DEFAULTS['contact_email'],
            'contact_phone' => $all['contact_phone'] ?? self::DEFAULTS['contact_phone'],
            'support_message' => $all['support_message'] ?? self::DEFAULTS['support_message'],
            'registration_enabled' => ($all['registration_enabled'] ?? '1') === '1',
        ];
    }

    public function update(array $payload): array
    {
        $this->ensureDefaults();

        foreach ($payload as $key => $value) {
            if (! array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            PlatformSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === null ? null : (string) $value],
            );
        }

        return $this->all();
    }

    private function ensureDefaults(): void
    {
        foreach (self::DEFAULTS as $key => $value) {
            PlatformSetting::query()->firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
