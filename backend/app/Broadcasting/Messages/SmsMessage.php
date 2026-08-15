<?php

namespace App\Broadcasting\Messages;

class SmsMessage
{
    public string $to;
    public string $content;

    public function to(string $to): self
    {
        $this->to = $to;
        return $this;
    }

    public function content(string $content): self
    {
        $this->content = $content;
        return $this;
    }
}
