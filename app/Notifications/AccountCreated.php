<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public User $user, public ?string $token = null)
    {
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        $emailUser = explode('@', $this->user->email)[0];
        $message = (new MailMessage())
            ->greeting('Olá ' . $emailUser . '!')
            ->line('Você está recebendo este e-mail porque foi criado uma conta no ' . config('app.name') . '.')
            ->line('Email: ' . $this->user->email)
            ->line('Obrigado por usar nossa aplicação!')
            ->action('Acesse sua conta', url('/login'));

        if (!is_null($this->token)) {
            return $message->action('Configure sua conta', url('/auth/password/reset/' . $this->token . '?email=' . urlencode($this->user->email)));
        }

        return $message;
    }
}
