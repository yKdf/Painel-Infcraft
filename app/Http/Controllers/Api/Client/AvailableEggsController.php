<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Support\Facades\DB;
use Pterodactyl\Http\Requests\Api\Client\EggListRequest;

class AvailableEggsController extends ClientApiController
{
    /**
     * @param EggListRequest $request
     * @return array
     */
    public function index(EggListRequest $request)
    {
        $eggs = DB::table('available_eggs')
            ->leftJoin('eggs', 'eggs.id', '=', 'available_eggs.egg_id')
            ->select(['eggs.name', 'eggs.thumbnail'])
            ->get();

        return [
            'success' => true,
            'data' => [
                'eggs' => $eggs,
            ],
        ];
    }
}
