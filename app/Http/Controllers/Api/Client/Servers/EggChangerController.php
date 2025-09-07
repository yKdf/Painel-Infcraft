<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Nest;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Services\Eggs\Sharing\EggImporterService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\EggChangerRequest;
use Pterodactyl\Services\Eggs\EggDeletionService;
use Pterodactyl\Services\Eggs\EggParserService;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;

class EggChangerController extends ClientApiController
{
    public function __construct(
        private StartupModificationService $startupModificationService,
        private ReinstallServerService $reinstallServerService,
        private EggParserService $eggParserService,
        private EggImporterService $eggImporterService,
        private EggDeletionService $eggDeletionService,
        private EggRepositoryInterface $eggRepository
    ) {
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
            $egg = DB::table('eggs')->select(['id', 'name', 'docker_images', 'thumbnail'])->where('id', '=', $item)->get();

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

        // Store current egg info for cleanup after egg change
        $currentEgg = DB::table('eggs')->where('id', '=', $server->egg_id)->first();
        $newEgg = $egg[0];
        
        // Get the "Imported Eggs" nest for later cleanup
        $importedNest = DB::table('nests')->where('name', '=', 'Imported Eggs')->first();

        $dockerImages = json_decode($egg[0]->docker_images, true);

        
        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

        try {
            $this->startupModificationService->handle($server, [
                'nest_id' => $egg[0]->nest_id,
                'egg_id' => $egg[0]->id,
                'docker_image' => reset($dockerImages),
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

        // Clean up imported eggs AFTER the egg change is complete
        // This prevents foreign key constraint errors
        if ($importedNest && $currentEgg && $currentEgg->nest_id == $importedNest->id) {
            
            $this->cleanupPreviousImportedEggs($server, $importedNest->id);
        }

        return [
            'success' => true,
            'data' => [],
        ];
    }

    /**
     * Import an egg from JSON data and add it to the server's available eggs.
     *
     * @param Request $request
     * @param Server $server
     * @return array
     * @throws DisplayException
     */
    public function import(Request $request, Server $server)
    {
        // Verificar se o usuário é administrador
        if (!$request->user()->root_admin) {
            throw new DisplayException('Apenas administradores podem importar eggs.');
        }

        $this->validate($request, [
            'json_data' => 'required|string',
            'autoApply' => 'boolean',
        ]);

        try {
            // Get or create a nest for imported eggs
            $importedNest = Nest::where('name', 'Imported Eggs')->first();
            if (!$importedNest) {
                $importedNest = Nest::create([
                    'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                    'author' => 'system@pterodactyl.io',
                    'name' => 'Imported Eggs',
                    'description' => 'Custom eggs imported by users through the panel interface.',
                ]);
            }

            // Create a temporary file with the JSON data
            $tempFile = tempnam(sys_get_temp_dir(), 'egg_import_');
            file_put_contents($tempFile, $request->input('json_data'));

            // Create an UploadedFile instance from the temporary file
            $uploadedFile = new UploadedFile(
                $tempFile,
                'imported_egg.json',
                'application/json',
                null,
                true
            );

            // Use the EggImporterService to import the egg
            $egg = $this->eggImporterService->handle($uploadedFile, $importedNest->id);

            // Add the imported egg to the global available_eggs table
            $globalAvailable = DB::table('available_eggs')->where('egg_id', '=', $egg->id)->get();
            if (count($globalAvailable) < 1) {
                DB::table('available_eggs')->insert([
                    'egg_id' => $egg->id
                ]);
            }

            // Add the imported egg to the server's available eggs
            $availableEggs = unserialize($server->available_eggs) ?: [];
            if (!in_array($egg->id, $availableEggs)) {
                $availableEggs[] = $egg->id;
                $server->available_eggs = serialize($availableEggs);
                $server->save();
            }

            // Clean up the temporary file
            unlink($tempFile);

            $response = [
                'success' => true,
                'data' => [
                    'egg' => [
                        'id' => $egg->id,
                        'name' => $egg->name,
                        'docker_images' => $egg->docker_images,
                        'thumbnail' => $egg->thumbnail,
                    ],
                    'message' => 'Egg imported successfully and added to available eggs.',
                    'applied' => false,
                ],
            ];

            // Apply the egg automatically
            
            try {
                // Create a new request for the change method
                $changeRequest = new Request([
                    'eggId' => $egg->id,
                    'reinstallServer' => $request->input('reinstallServer', false),
                ]);

                // Call the change method to apply the egg
                // We need to bypass the EggChangerRequest validation since we're calling internally
                $this->validate($changeRequest, [
                    'eggId' => 'required|integer',
                ]);

                $reinstallServer = (bool) $changeRequest->input('reinstallServer', false);

                $eggData = DB::table('eggs')->where('id', '=', (int) $changeRequest->input('eggId', 0))->get();
                if (count($eggData) < 1) {
                    throw new DisplayException('Egg not found.');
                }

                $available = DB::table('available_eggs')->where('egg_id', '=', (int) $changeRequest->input('eggId', 0))->get();
                if (count($available) < 1) {
                    throw new DisplayException('This egg isn\'t available to this server.');
                }

                $available_eggs = unserialize($server->available_eggs);
                if (!in_array((int) $changeRequest->input('eggId', 0), $available_eggs)) {
                    throw new DisplayException('This egg isn\'t available to this server.');
                }

                $dockerImages = json_decode($eggData[0]->docker_images, true);

                $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

                $this->startupModificationService->handle($server, [
                    'egg_id' => $eggData[0]->id,
                    'docker_image' => reset($dockerImages),
                    'startup' => $eggData[0]->startup,
                    'environment' => [], // Empty environment variables for now
                ]);

                // Clean up previously imported eggs after successful application
                $this->cleanupPreviousImportedEggs($server, $importedNest->id);

                if ($reinstallServer) {
                    $this->reinstallServerService->handle($server);
                }

                $response['data']['message'] = 'Egg imported and applied successfully.';
                $response['data']['applied'] = true;
            } catch (\Throwable $e) {
                Log::error('Failed to auto-apply imported egg: ' . $e->getMessage(), [
                    'server_id' => $server->id,
                    'egg_id' => $egg->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                $response['data']['message'] = 'Egg imported successfully, but failed to apply automatically: ' . $e->getMessage();
            }

            return $response;
        } catch (\Throwable $e) {
            // Clean up the temporary file if it exists
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }

            Log::error('Failed to import egg: ' . $e->getMessage(), [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new DisplayException('Failed to import egg: ' . $e->getMessage());
        }
    }

    /**
     * Clean up previously imported eggs for this server.
     *
     * @param Server $server
     * @param int $importedNestId
     * @return void
     */
    private function cleanupPreviousImportedEggs(Server $server, int $importedNestId)
    {
        try {
            // Get current available eggs for the server
            $availableEggs = unserialize($server->available_eggs) ?: [];
            
            // Find eggs from the "Imported Eggs" nest that are in the server's available eggs
            // but exclude the current egg being used by the server
            $importedEggs = DB::table('eggs')
                ->where('nest_id', $importedNestId)
                ->whereIn('id', $availableEggs)
                ->where('id', '!=', $server->egg_id) // Don't delete the current egg
                ->pluck('id')
                ->toArray();
            
            if (!empty($importedEggs)) {
                // Remove imported eggs from server's available eggs
                $availableEggs = array_diff($availableEggs, $importedEggs);
                $server->available_eggs = serialize($availableEggs);
                $server->save();
                
                // Delete each egg properly using EggDeletionService
                foreach ($importedEggs as $eggId) {
                    try {
                        // Check if egg has other servers using it as their current egg
                        $otherServersCount = DB::table('servers')
                            ->where('egg_id', $eggId)
                            ->where('id', '!=', $server->id)
                            ->count();
                        
                        // Check if egg is in other servers' available eggs
                        $otherServersWithEgg = DB::table('servers')
                            ->where('id', '!=', $server->id)
                            ->get()
                            ->filter(function ($otherServer) use ($eggId) {
                                $otherAvailableEggs = unserialize($otherServer->available_eggs) ?: [];
                                return in_array($eggId, $otherAvailableEggs);
                            })
                            ->count();
                        
                        if ($otherServersCount === 0 && $otherServersWithEgg === 0) {
                            // Safe to delete completely - no other servers using or have this egg available
                            // Remove from available_eggs and default_eggs tables globally
                            DB::table('available_eggs')->where('egg_id', $eggId)->delete();
                            DB::table('default_eggs')->where('egg_id', $eggId)->delete();
                            
                            // Delete the egg itself
                            $this->eggRepository->delete($eggId);
                            
                        } else {
                            // Other servers are using this egg or have it available, only remove from this server's available eggs
                            DB::table('available_eggs')
                                ->where('egg_id', $eggId)
                                ->where('server_id', $server->id)
                                ->delete();
                            
                        }
                    } catch (\Throwable $eggError) {
                        Log::warning('Failed to delete individual imported egg', [
                            'server_id' => $server->id,
                            'egg_id' => $eggId,
                            'error' => $eggError->getMessage(),
                        ]);
                    }
                }
                
                
                // Check if the "Imported Eggs" nest is now empty and remove it if so
                $remainingEggsInNest = DB::table('eggs')
                    ->where('nest_id', $importedNestId)
                    ->count();
                
                if ($remainingEggsInNest === 0) {
                    try {
                        // Remove the empty nest
                        DB::table('nests')->where('id', $importedNestId)->delete();
                        
                    } catch (\Throwable $nestError) {
                        Log::warning('Failed to delete empty imported nest', [
                            'server_id' => $server->id,
                            'nest_id' => $importedNestId,
                            'error' => $nestError->getMessage(),
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to cleanup previously imported eggs: ' . $e->getMessage(), [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
