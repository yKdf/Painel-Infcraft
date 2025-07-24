<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDefaultEggsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('default_eggs', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('egg_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('default_eggs');
    }
}
