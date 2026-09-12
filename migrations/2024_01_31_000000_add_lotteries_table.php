<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('lotteries')) {
            return;
        }

        $schema->create('lotteries', function (Blueprint $table) {
            $table->increments('id');
            $table->string('prizes');
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('amount')->default(1);
            $table->timestamp('end_date')->nullable();
            $table->unsignedInteger('post_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->unsignedInteger('min_participants')->default(0);
            $table->unsignedInteger('max_participants')->default(999999);
            $table->unsignedInteger('enter_count')->default(0);
            $table->boolean('can_cancel_enter')->default(false);
            $table->unsignedTinyInteger('status')->default(0);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('post_id');

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    },

    'down' => function (Builder $schema) {
        $schema->dropIfExists('lotteries');
    },
];
