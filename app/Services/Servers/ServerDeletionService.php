<?php

namespace Pterodactyl\Services\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Databases\DatabaseManagementService;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Exception;

class ServerDeletionService
{
    protected bool $force = false;
    protected bool $deleteAllSplit = false;

    /**
     * ServerDeletionService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private DaemonServerRepository $daemonServerRepository,
        private DatabaseManagementService $databaseManagementService
    ) {
    }

    /**
     * Set if the server should be forcibly deleted from the panel (ignoring daemon errors) or not.
     */
    public function withForce(bool $bool = true): self
    {
        $this->force = $bool;

        return $this;
    }

    /**
     * Set if all split servers should be deleted.
     */
    public function withDeleteAllSplit(bool $bool = true): self
    {
        $this->deleteAllSplit = $bool;

        return $this;
    }

    /**
     * Delete a server from the panel and remove any associated databases from hosts.
     *
     * @throws \Throwable
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function handle(Server $server): void
    {
        $servers = [$server];

        // If it is a Split Master and we want to delete all children
        if ($this->deleteAllSplit) {
            // Check if it's a master (has split_limit > 0 usually, or just check if children exist)
            // Or if it's a child, maybe we simply want to delete the whole group?
            // The previous logic was: if it has a split_masteruuid, get ALL servers in that group.
            
            // New Logic: 
            // If Master: Get all children.
            // If Child: Get all group? The user said "remove o server mas tenho que dar um atualizar ainda" implying single deletion usually.
            // But if "Admin wants to delete ALL", let's support that.
            
            if (!empty($server->split_masteruuid)) {
                 // It's a child. If we chose "delete all", we delete the whole group (master + siblings + self)
                 $servers = Server::query()->where('split_masteruuid', $server->split_masteruuid)
                    ->orWhere('uuid', $server->split_masteruuid)
                    ->get();
            } else {
                 // It's a master (potentially). Find children.
                 $children = Server::query()->where('split_masteruuid', $server->uuid)->get();
                 if ($children->isNotEmpty()) {
                     $servers = $children->merge([$server]);
                 }
            }
        } else {
            // We are deleting ONLY this server.
            // IF it is a CHILD, we must return resources to the master.
             if (!empty($server->split_masteruuid)) {
                 $master = Server::query()->where('uuid', $server->split_masteruuid)->first();
                 if ($master) {
                    // Logic from SplittedController
                     $master->update([
                        'cpu' => $master->cpu + $server->cpu,
                        'memory' => $master->memory + $server->memory,
                        'disk' => $master->disk + $server->disk,
                        'swap' => $master->swap + $server->swap,
                    ]);
                 }
             }
        }

        try {
            foreach($servers as $oneserver) {
                $this->daemonServerRepository->setServer($oneserver)->delete();
            }
        } catch (DaemonConnectionException $exception) {
            // If there is an error not caused a 404 error and this isn't a forced delete,
            // go ahead and bail out. We specifically ignore a 404 since that can be assumed
            // to be a safe error, meaning the server doesn't exist at all on Wings so there
            // is no reason we need to bail out from that.
            if (!$this->force && $exception->getStatusCode() !== Response::HTTP_NOT_FOUND) {
                throw $exception;
            }

            Log::warning($exception);
        }

        foreach($servers as $oneserver) {
            $this->connection->transaction(function () use ($oneserver) {
                foreach ($oneserver->databases as $database) {
                    try {
                        $this->databaseManagementService->delete($database);
                    } catch (Exception $exception) {
                        if (!$this->force) {
                            throw $exception;
                        }

                        // Oh well, just try to delete the database entry we have from the database
                        // so that the server itself can be deleted. This will leave it dangling on
                        // the host instance, but we couldn't delete it anyways so not sure how we would
                        // handle this better anyways.
                        //
                        // @see https://github.com/pterodactyl/panel/issues/2085
                        $database->delete();

                        Log::warning($exception);
                    }
                }

                $oneserver->delete();
            });
        }
    }
    
    // Kept for compatibility if still used essentially for API/Client side
    public function handlesplitted(Server $server)
    {
       $this->handle($server);
    }
}
