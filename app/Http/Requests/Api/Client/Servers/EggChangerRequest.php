<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class EggChangerRequest extends ClientApiRequest
{
    /**
     * Determine if the API user has permission to perform this action.
     */
    public function permission(): string
    {
        return 'eggchanger.manage';
    }
}
