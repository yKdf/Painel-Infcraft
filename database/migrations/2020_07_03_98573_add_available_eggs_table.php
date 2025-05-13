<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddAvailableEggsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('available_eggs', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('egg_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('available_eggs');
    }
}
