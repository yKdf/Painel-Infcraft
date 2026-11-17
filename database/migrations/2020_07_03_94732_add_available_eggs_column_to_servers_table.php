<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddAvailableEggsColumnToServersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            // MySQL does not consistently support defaults on TEXT columns.
            // Add it as nullable first so this migration also works when the
            // servers table already contains records.
            $table->text('available_eggs')->nullable()->after('description');
        });

        DB::table('servers')
            ->whereNull('available_eggs')
            ->update(['available_eggs' => 'a:0:{}']);

        Schema::table('servers', function (Blueprint $table) {
            $table->text('available_eggs')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('available_eggs');
        });
    }
}
