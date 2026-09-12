<?php

namespace Nodeloc\Lottery\Api\Resource;

use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Illuminate\Database\Eloquent\Builder;
use Nodeloc\Lottery\LotteryParticipants;

/**
 * @extends AbstractDatabaseResource<LotteryParticipants>
 */
class LotteryParticipantResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'lottery-participants';
    }

    public function model(): string
    {
        return LotteryParticipants::class;
    }

    public function scope(Builder $query, \Tobyz\JsonApiServer\Context $context): void
    {
        $query->whereHas('lottery', fn (Builder $lotteries) => $lotteries->whereVisibleTo($context->getActor()));
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Show::make(),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Integer::make('lotteryId')
                ->property('lottery_id'),
            Schema\Integer::make('status'),
            Schema\DateTime::make('createdAt'),
            Schema\DateTime::make('updatedAt'),
            Schema\Relationship\ToOne::make('lottery')
                ->type('lotteries')
                ->includable(),
            Schema\Relationship\ToOne::make('user')
                ->type('users')
                ->includable(),
        ];
    }
}
