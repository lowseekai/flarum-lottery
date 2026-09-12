<?php

namespace Nodeloc\Lottery\Api\Resource;

use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Illuminate\Database\Eloquent\Builder;
use Nodeloc\Lottery\LotteryOption;

/**
 * @extends AbstractDatabaseResource<LotteryOption>
 */
class LotteryOptionResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'lottery-options';
    }

    public function model(): string
    {
        return LotteryOption::class;
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
            Schema\Str::make('operatorType')
                ->property('operator_type'),
            Schema\Integer::make('operator'),
            Schema\Integer::make('operatorValue')
                ->property('operator_value'),
            Schema\DateTime::make('createdAt'),
            Schema\DateTime::make('updatedAt'),
            Schema\Relationship\ToOne::make('lottery')
                ->type('lotteries')
                ->includable(),
        ];
    }
}
