<?php

namespace Nodeloc\Lottery\Api\Resource;

use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Bus\Dispatcher;
use Flarum\Post\Post;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Nodeloc\Lottery\Commands\EditLottery;
use Nodeloc\Lottery\Commands\EnterLottery;
use Nodeloc\Lottery\Lottery;
use Nodeloc\Lottery\LotteryRepository;

/**
 * @extends AbstractDatabaseResource<Lottery>
 */
class LotteryResource extends AbstractDatabaseResource
{
    public function __construct(
        protected Dispatcher $bus,
        protected LotteryRepository $lotteries,
    ) {
    }

    public function type(): string
    {
        return 'lotteries';
    }

    public function model(): string
    {
        return Lottery::class;
    }

    public function scope(Builder $query, \Tobyz\JsonApiServer\Context $context): void
    {
        Lottery::setStateUser($context->getActor());
        $query->whereVisibleTo($context->getActor());
    }

    public function endpoints(): array
    {
        $includes = [
            'options',
            'lotteryParticipants',
        ];

        return [
            Endpoint\Show::make()
                ->defaultInclude($includes),
            Endpoint\Endpoint::make('update')
                ->route('PATCH', '/{id}')
                ->authenticated()
                ->can('edit')
                ->defaultInclude($includes)
                ->action(function (Context $context): Lottery {
                    return $this->bus->dispatch(new EditLottery(
                        $context->getActor(),
                        (int) $context->model->getKey(),
                        (array) Arr::get($context->body(), 'data', []),
                    ));
                }),
            Endpoint\Delete::make()
                ->authenticated()
                ->can('delete'),
            Endpoint\Endpoint::make('enter')
                ->route('PATCH', '/{id}/enter')
                ->authenticated()
                ->can('enter')
                ->defaultInclude($includes)
                ->action(function (Context $context): Lottery {
                    return $this->bus->dispatch(new EnterLottery(
                        $context->getActor(),
                        (int) $context->model->getKey(),
                    ));
                }),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('prizes'),
            Schema\Integer::make('price'),
            Schema\Integer::make('amount'),
            Schema\Boolean::make('hasEnded')
                ->get(fn (Lottery $lottery) => $lottery->hasEnded()),
            Schema\Integer::make('minParticipants'),
            Schema\Integer::make('maxParticipants'),
            Schema\Integer::make('enterCount'),
            Schema\Integer::make('status'),
            Schema\DateTime::make('endDate')
                ->property('end_date'),
            Schema\DateTime::make('createdAt'),
            Schema\DateTime::make('updatedAt'),
            Schema\Boolean::make('canEnter')
                ->get(fn (Lottery $lottery, Context $context) => $context->getActor()->can('enter', $lottery)),
            Schema\Boolean::make('canEdit')
                ->get(fn (Lottery $lottery, Context $context) => $context->getActor()->can('edit', $lottery)),
            Schema\Boolean::make('canDelete')
                ->get(fn (Lottery $lottery, Context $context) => $context->getActor()->can('delete', $lottery)),
            Schema\Boolean::make('allowCancelEnter')
                ->property('can_cancel_enter'),
            Schema\Boolean::make('canCancelEnter')
                ->get(fn (Lottery $lottery, Context $context) => $context->getActor()->can('cancelEnter', $lottery)),
            Schema\Boolean::make('canSeeParticipants')
                ->get(fn (Lottery $lottery, Context $context) => $context->getActor()->can('seeParticipants', $lottery)),

            Schema\Relationship\ToOne::make('post')
                ->type('posts')
                ->includable(),
            Schema\Relationship\ToOne::make('user')
                ->type('users')
                ->includable(),
            Schema\Relationship\ToMany::make('options')
                ->type('lottery-options')
                ->includable(),
            Schema\Relationship\ToMany::make('participants')
                ->type('lottery-participants')
                ->includable()
                ->visible(fn (Lottery $lottery, Context $context) => $context->getActor()->can('seeParticipants', $lottery)),
            Schema\Relationship\ToMany::make('lotteryParticipants')
                ->type('lottery-participants')
                ->includable()
                ->get(function (Lottery $lottery, Context $context): array {
                    $actor = $context->getActor();

                    if (! $actor->exists) {
                        return [];
                    }

                    return $lottery->participants()
                        ->where('user_id', $actor->id)
                        ->get()
                        ->all();
                }),
        ];
    }
}
