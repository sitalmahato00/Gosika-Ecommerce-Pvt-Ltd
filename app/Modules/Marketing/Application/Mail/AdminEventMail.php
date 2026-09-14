<?php

namespace App\Modules\Marketing\Application\Mail;

class AdminEventMail extends BrandedMail
{
    public function __construct(
        public string $subjectLine,
        public string $headline,
        public string $message,
        public ?string $link = null,
        public ?string $linkLabel = null,
    ) {
    }

    public function build(): static
    {
        return $this
            ->subject($this->subjectLine)
            ->sendBranded('mail.emails.admin-event', [
                'headline' => $this->headline,
                'message' => $this->message,
                'link' => $this->link,
                'linkLabel' => $this->linkLabel,
            ]);
    }
}