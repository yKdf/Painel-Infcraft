<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MailTested extends Notification
{
    public function __construct(private User $user)
    {
    }

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        $emailUser = explode('@', $this->user->email)[0];
        return (new MailMessage())
            ->subject('Pterodactyl Test Message')
            ->greeting('Hello ' . $this->user->name . '!')
            ->greeting('Olá '. $this->user->name_first . '!')
            ->line('This is a test of the Pterodactyl mail system. You\'re good to go!')
            ->line('Nome '. $emailUser . '!');

    }
}
