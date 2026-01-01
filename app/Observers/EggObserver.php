<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\Egg;
use Illuminate\Support\Facades\DB;

class EggObserver
{
    /**
     * Handle the Egg "created" event.
     * Automatically add newly created eggs to available_eggs table.
     */
    public function created(Egg $egg): void
    {
        // Check if this egg is already in available_eggs
        $exists = DB::table('available_eggs')
            ->where('egg_id', '=', $egg->id)
            ->exists();
        
        if (!$exists) {
            // Add to available_eggs table
            DB::table('available_eggs')->insert([
                'egg_id' => $egg->id
            ]);
        }
    }
    
    /**
     * Handle the Egg "deleted" event.
     * This is a backup in case EggDeletionService is bypassed.
     */
    public function deleted(Egg $egg): void
    {
        // Remove from available_eggs and default_eggs
        DB::table('available_eggs')->where('egg_id', '=', $egg->id)->delete();
        DB::table('default_eggs')->where('egg_id', '=', $egg->id)->delete();
        
        // Remove from all servers' available_eggs arrays
        $servers = DB::table('servers')
            ->select(['id', 'available_eggs'])
            ->get();
        
        foreach ($servers as $server) {
            if (empty($server->available_eggs)) {
                continue;
            }
            
            $availableEggs = json_decode($server->available_eggs, true) ?: [];
            
            if (in_array($egg->id, $availableEggs)) {
                $availableEggs = array_values(array_diff($availableEggs, [$egg->id]));
                
                DB::table('servers')
                    ->where('id', '=', $server->id)
                    ->update(['available_eggs' => json_encode($availableEggs)]);
            }
        }
    }
}
