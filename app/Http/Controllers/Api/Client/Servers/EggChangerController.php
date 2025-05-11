<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\EggChangerRequest;

class EggChangerController extends ClientApiController
{
    /**
     * @var \Pterodactyl\Services\Servers\StartupModificationService
     */
    protected $startupModificationService;

    /**
     * @var \Pterodactyl\Services\Servers\ReinstallServerService
     */
    protected $reinstallServerService;

    /**
     * EggChangerController constructor.
     * @param StartupModificationService $startupModificationService
     * @param ReinstallServerService $reinstallServerService
     */
    public function __construct(StartupModificationService $startupModificationService, ReinstallServerService $reinstallServerService)
    {
        parent::__construct();

        $this->startupModificationService = $startupModificationService;
        $this->reinstallServerService = $reinstallServerService;
    }

    /**
     * @param EggChangerRequest $request
     * @param Server $server
     * @return array
     */
    public function index(EggChangerRequest $request, Server $server)
    {
        $selectable_eggs = [];

        foreach (unserialize($server->available_eggs) as $item) {
            $egg = DB::table('eggs')->select(['id', 'name', 'thumbnail'])->where('id', '=', $item)->get();

            if (count($egg) > 0) {
                array_push($selectable_eggs, $egg[0]);
            }
        }

        return [
            'success' => true,
            'data' => [
                'eggs' => $selectable_eggs,
                'currentEggId' => $server->egg_id,
            ],
        ];
    }

    /**
     * @param EggChangerRequest $request
     * @param Server $server
     * @return array
     * @throws DisplayException
     * @throws \Illuminate\Validation\ValidationException
     */
    public function change(EggChangerRequest $request, Server $server)
    {
        $this->validate($request, [
            'eggId' => 'required|integer',
        ]);

        $reinstallServer = (bool) $request->input('reinstallServer', false);

        $egg = DB::table('eggs')->where('id', '=', (int) $request->input('eggId', 0))->get();
        if (count($egg) < 1) {
            throw new DisplayException('Egg not found.');
        }

        $available = DB::table('available_eggs')->where('egg_id', '=', (int) $request->input('eggId', 0))->get();
        if (count($available) < 1) {
            throw new DisplayException('This egg isn\'t available to this server.');
        }

        $available_eggs = unserialize($server->available_eggs);
        if (!in_array((int) $request->input('eggId', 0), $available_eggs)) {
            throw new DisplayException('This egg isn\'t available to this server.');
        }

        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

        try {
            $this->startupModificationService->handle($server, [
                'nest_id' => $egg[0]->nest_id,
                'egg_id' => $egg[0]->id,
                'docker_image' => json_decode($egg[0]->docker_images, true)[0],
                'startup' => $egg[0]->startup,
            ]);
        } catch (\Throwable $e) {
            throw new DisplayException('Failed to change the egg. Please try again...');
        }

        if ($reinstallServer) {
            try {
                $this->reinstallServerService->handle($server);
            } catch (\Throwable $e) {
                throw new DisplayException('Egg was changed, but failed to trigger server reinstall.');
            }
        }

        return [
            'success' => true,
            'data' => [],
        ];
    }
}
