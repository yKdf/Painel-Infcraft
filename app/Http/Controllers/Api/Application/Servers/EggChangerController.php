<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Servers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class EggChangerController extends ApplicationApiController
{
    /**
     * @param Request $request
     * @param $server
     * @return mixed
     */
    public function index(Request $request, $server)
    {
        $eggs = [];
        $available_eggs = unserialize($server->available_eggs);

        foreach ($available_eggs as $available_egg) {
            $egg = DB::table('eggs')->select(['id', 'nest_id', 'author', 'name', 'description', 'thumbnail'])->where('id', '=', $available_egg)->get();

            if (count($egg) > 0) {
                array_push($eggs, $egg[0]);
            }
        }

        return json_decode(json_encode($eggs), true);
    }

    /**
     * @param Request $request
     * @param $server
     * @return \Illuminate\Http\JsonResponse
     */
    public function add(Request $request, $server)
    {
        $new_ids = $request->input('new_ids', []);
        $available_eggs = unserialize($server->available_eggs);

        if (empty($new_ids)) {
            return response()->json(['error' => 'New ids parameter is empty.'], 500);
        }

        $new_ids = array_unique($new_ids);

        foreach ($new_ids as $new_id) {
            $isset = DB::table('available_eggs')->where('egg_id', '=', $new_id)->get();
            if (count($isset) < 1) {
                return response()->json(['error' => 'Invalid egg id: ' . $new_id], 500);
            }
        }

        foreach ($new_ids as $new_id) {
            foreach ($available_eggs as $available_egg) {
                if ($new_id == $available_egg) {
                    return response()->json(['error' => 'This egg id is already added to this server: ' . $new_id], 500);
                }
            }
        }

        foreach ($new_ids as $new_id) {
            array_push($available_eggs, $new_id);
        }

        DB::table('servers')->where('id', '=', $server->id)->update([
            'available_eggs' => serialize($available_eggs)
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * @param Request $request
     * @param $server
     * @return \Illuminate\Http\JsonResponse
     */
    public function remove(Request $request, $server)
    {
        $remove_ids = $request->input('remove_ids', []);
        $available_eggs = unserialize($server->available_eggs);

        if (empty($remove_ids)) {
            return response()->json(['error' => 'Remove ids parameter is empty.'], 500);
        }

        $remove_ids = array_unique($remove_ids);

        foreach ($remove_ids as $remove_id) {
            if (!in_array($remove_id, $available_eggs)) {
                return response()->json(['error' => 'This egg isn\'t added to this server: ' . $remove_id], 500);
            }
        }

        foreach ($remove_ids as $remove_id) {
            foreach ($available_eggs as $key => $available_egg) {
                if ($remove_id == $available_egg) {
                    array_splice($available_eggs, $key, 1);
                }
            }
        }

        DB::table('servers')->where('id', '=', $server->id)->update([
            'available_eggs' => serialize($available_eggs)
        ]);

        return response()->json(['success' => true]);
    }
}
