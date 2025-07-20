<?php

namespace Pterodactyl\Services\Users;

use Pterodactyl\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Pterodactyl\Traits\Services\HasUserLevels;
use Illuminate\Support\Str;


class UserUpdateService
{
    use HasUserLevels;

    /**
     * UserUpdateService constructor.
     */
    public function __construct(private Hasher $hasher)
    {
    }

    /**
     * Update the user model instance and return the updated model.
     *
     * @throws \Throwable
     */
    public function handle(User $user, array $data): User
    {

        $generatedUsername = Str::random(8);

        if (!isset($data['username']) || empty($data['username'])) {
        $data['username'] = $generatedUsername;
        }
        if (!isset($data['name_first']) || empty($data['name_first'])) {
        $data['name_first'] = $generatedUsername;
        }
        if (!isset($data['name_last']) || empty($data['name_last'])) {
        $data['name_last'] = $generatedUsername;
        }

        if (!empty(array_get($data, 'password'))) {
            $data['password'] = $this->hasher->make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->forceFill($data)->saveOrFail();

        return $user->refresh();
    }
}
