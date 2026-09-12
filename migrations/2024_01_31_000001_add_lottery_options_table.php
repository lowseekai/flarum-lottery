<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('lottery_options')) {
            return;
        }

        $schema->create('lottery_options', function (Blueprint $table) {
            $table->increments('id');
            $table->string('operator_type', 256);
            $table->unsignedInteger('lottery_id');
            $table->unsignedTinyInteger('operator');
            $table->integer('operator_value');
            $table->timestamps();

            $table->index('lottery_id');

            $table->foreign('lottery_id')
                ->references('id')
                ->on('lotteries')
                ->onDelete('cascade');
        });
    },

    'down' => function (Builder $schema) {
        $schema->dropIfExists('lottery_options');
    },
];
