<?php
/**
 * Pterodactyl - Panel
 * Copyright (c) 2015 - 2017 Dane Everitt <dane@daneeveritt.com>.
 *
 * This software is licensed under the terms of the MIT license.
 * https://opensource.org/licenses/MIT
 */

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;

class EggChangerController extends Controller
{
    /**
     * @var \Prologue\Alerts\AlertsMessageBag
     */
    protected $alert;

    /**
     * EggChangerController constructor.
     * @param AlertsMessageBag $alert
     */
    public function __construct(AlertsMessageBag $alert)
    {
        $this->alert = $alert;
    }

    /**
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index()
    {
        $eggs = DB::table('eggs')->get();
        $available_eggs = DB::table('available_eggs')->get();
        $default_eggs = DB::table('default_eggs')->get();

        foreach ($eggs as $key => $egg) {
            $eggs[$key]->selected = '';

            foreach ($available_eggs as $available_egg) {
                if ($egg->id == $available_egg->egg_id) {
                    $eggs[$key]->selected = 'selected';
                }
            }
        }

        foreach ($available_eggs as $key => $available_egg) {
            foreach ($eggs as $egg) {
                if ($available_egg->egg_id == $egg->id) {
                    $available_eggs[$key]->egg = $egg;
                }
            }

            $available_eggs[$key]->selected = '';

            foreach ($default_eggs as $default_egg) {
                if ($available_egg->egg_id == $default_egg->egg_id) {
                    $available_eggs[$key]->selected = 'selected';
                }
            }
        }

        return view('admin.eggchanger', [
            'eggs' => $eggs,
            'available_eggs' => $available_eggs
        ]);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function availables(Request $request)
    {
        $eggs = $request->input('eggs', []);

        $olds = DB::table('available_eggs')->get();
        foreach ($olds as $old) {
            if (!in_array($old->egg_id, $eggs)) {
                DB::table('available_eggs')->where('egg_id', '=', $old->egg_id)->delete();
            }
        }

        foreach ($eggs as $egg) {
            $issetEgg = DB::table('eggs')->where('id', '=', $egg)->get();
            if (count($issetEgg) < 1) {
                $this->alert->danger('Egg not found.')->flash();

                return redirect()->route('admin.eggchanger');
            }

            $isset = DB::table('available_eggs')->where('egg_id', '=', $egg)->get();
            if (count($isset) < 1) {
                DB::table('available_eggs')->insert([
                    'egg_id' => $egg
                ]);
            }
        }

        $this->alert->success('You have successfully updated available eggs.')->flash();

        return redirect()->route('admin.eggchanger');
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function defaults(Request $request)
    {
        $eggs = $request->input('eggs', []);

        $olds = DB::table('default_eggs')->get();
        foreach ($olds as $old) {
            if (!in_array($old->egg_id, $eggs)) {
                DB::table('default_eggs')->where('egg_id', '=', $old->egg_id)->delete();
            }
        }

        foreach ($eggs as $egg) {
            $available = DB::table('available_eggs')->where('id', '=', $egg)->get();
            if (count($available) < 1) {
                $this->alert->danger('Egg not found.')->flash();

                return redirect()->route('admin.eggchanger');
            }

            $isset = DB::table('default_eggs')->where('egg_id', '=', $available[0]->egg_id)->get();
            if (count($isset) < 1) {
                DB::table('default_eggs')->insert([
                    'egg_id' => $available[0]->egg_id
                ]);
            }
        }

        $servers = DB::table('servers')->select(['id'])->get();
        foreach ($servers as $srv) {
            foreach ($eggs as $egg) {
                $server = DB::table('servers')->select(['id', 'available_eggs'])->where('id', '=', $srv->id)->get();
                $server_availables = unserialize($server[0]->available_eggs);
                $available = DB::table('available_eggs')->where('id', '=', $egg)->get();

                if (!in_array($available[0]->egg_id, $server_availables)) {
                    array_push($server_availables, $available[0]->egg_id);
                    DB::table('servers')->where('id', '=', $server[0]->id)->update(['available_eggs' => serialize($server_availables)]);
                }
            }
        }

        $this->alert->success('You have successfully updated default eggs.')->flash();

        return redirect()->route('admin.eggchanger');
    }

    /**
     * @param Request $request
     * @param $server_id
     * @return 161026 \Illuminate\Http\RedirectResponse
     */
    public function serverAvailables(Request $request, $server_id)
    {
        $server = DB::table('servers')->where('id', '=', $server_id)->get();
        if (count($server) < 1) {
            $this->alert->danger('Server not found.')->flash();

            return redirect()->route('admin.servers');
        }

        $selectableEggs = [];
        $eggs = $request->input('selectableEggs', []);

        foreach ($eggs as $egg) {
            $availableEgg = DB::table('available_eggs')->where('id', '=', $egg)->get();
            if (count($availableEgg) < 1) {
                $this->alert->danger('Egg not found.')->flash();

                return redirect()->route('admin.servers.view.manage', $server_id);
            }

            array_push($selectableEggs, $availableEgg[0]->egg_id);
        }

        DB::table('servers')->where('id', '=', $server_id)->update([
            'available_eggs' => serialize($selectableEggs)
        ]);

        $this->alert->success('You have successfully updated selectable eggs.')->flash();

        return redirect()->route('admin.servers.view.manage', $server_id);
    }
}
