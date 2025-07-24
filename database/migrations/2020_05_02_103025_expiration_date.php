<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ExpirationDate extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->date('exp_date');
        });
    }

    /**
     * Reverse the migrations.
     *
     */
    public function down() {
        Schema::table('servers', function ($table) {
          $table->dropColumn('exp_date');
        });
      }
}