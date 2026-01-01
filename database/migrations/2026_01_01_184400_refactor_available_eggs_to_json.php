<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all servers with available_eggs data
        $servers = DB::table('servers')->select('id', 'available_eggs')->get();

        foreach ($servers as $server) {
            if (empty($server->available_eggs)) {
                // Set empty array as JSON
                DB::table('servers')
                    ->where('id', $server->id)
                    ->update(['available_eggs' => json_encode([])]);
                continue;
            }

            try {
                // Try to unserialize the data
                $data = @unserialize($server->available_eggs);

                // Check if unserialize failed
                if ($data === false && $server->available_eggs !== 'b:0;') {
                    // Check if it's already JSON
                    if (str_starts_with($server->available_eggs, '[') || str_starts_with($server->available_eggs, '{')) {
                        // Already JSON, skip
                        continue;
                    }
                    // Corrupted data, set to empty array
                    $data = [];
                }
                
                // Ensure it's an array
                if (!is_array($data)) {
                    $data = [];
                }

                // Convert to JSON
                DB::table('servers')
                    ->where('id', $server->id)
                    ->update(['available_eggs' => json_encode($data)]);

            } catch (\Exception $e) {
                // On error, set to empty array
                DB::table('servers')
                    ->where('id', $server->id)
                    ->update(['available_eggs' => json_encode([])]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $servers = DB::table('servers')->select('id', 'available_eggs')->get();

        foreach ($servers as $server) {
            if (empty($server->available_eggs)) {
                continue;
            }
            
            $data = json_decode($server->available_eggs, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                // Not JSON, might already be serialized
                continue;
            }

            // Convert back to serialized format
            DB::table('servers')
                ->where('id', $server->id)
                ->update(['available_eggs' => serialize($data ?? [])]);
        }
    }
};
