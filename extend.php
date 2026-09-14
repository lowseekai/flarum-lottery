<?php

namespace Nodeloc\Lottery;

use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource;
use Flarum\Api\Schema;
use Flarum\Discussion\Discussion;
use Flarum\Discussion\Event\Saving as DiscussionSaving;
use Flarum\Extend;
use Flarum\Post\Event\Saving as PostSaving;
use Flarum\Post\Post;
use Flarum\User\User;
use Nodeloc\Lottery\Api\PendingLotteryData;
use Nodeloc\Lottery\Api\Resource\LotteryOptionResource;
use Nodeloc\Lottery\Api\Resource\LotteryParticipantResource;
use Nodeloc\Lottery\Api\Resource\LotteryResource;
use Nodeloc\Lottery\Commands\CreateLottery;
use Nodeloc\Lottery\Notification\DrawLotteryBlueprint;
use Nodeloc\Lottery\Notification\FailLotteryBlueprint;
use Nodeloc\Lottery\Notification\FinishLotteryBlueprint;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/resources/less/admin.less'),

    new Extend\Locales(__DIR__.'/resources/locale'),

    (new Extend\View())
        ->namespace('nodeloc-lottery', __DIR__.'/resources/views'),

    new Extend\ApiResource(LotteryResource::class),
    new Extend\ApiResource(LotteryOptionResource::class),
    new Extend\ApiResource(LotteryParticipantResource::class),

    (new Extend\Model(Post::class))
        ->hasOne('lottery', Lottery::class, 'post_id', 'id'),

    (new Extend\Model(Discussion::class))
        ->hasOne('lottery', Lottery::class, 'post_id', 'first_post_id')
        ->cast('is_lottery', 'bool'),

    (new Extend\Event())
        ->listen(DiscussionSaving::class, Listeners\SaveLotteryToDiscussion::class)
        ->listen(PostSaving::class, Listeners\SaveLotteryToDatabase::class)
        ->listen(\Flarum\Settings\Event\Saved::class, Listeners\ClearFormatterCache::class),

    (new Extend\ApiResource(Resource\DiscussionResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('hasLottery')
                ->get(fn (Discussion $discussion) => (bool) $discussion->is_lottery),
            Schema\Boolean::make('canStartLottery')
                ->get(fn (Discussion $discussion, Context $context) => $context->getActor()->can('discussion.lottery.start', $discussion)),
            Schema\Arr::make('lotteryData')
                ->hidden()
                ->writableOnCreate()
                ->set(function (Discussion $discussion, array $value) {
                    $discussion->is_lottery = true;
                    PendingLotteryData::set($discussion, $value);
                }),
            Schema\Relationship\ToOne::make('lottery')
                ->type('lotteries')
                ->includable(),
        ])
        ->endpoint(
            [Endpoint\Show::class, Endpoint\Create::class],
            function (Endpoint\Show|Endpoint\Create $endpoint): Endpoint\Endpoint {
                return $endpoint->addDefaultInclude([
                    'lottery',
                    'lottery.options',
                    'lottery.lotteryParticipants',
                    'firstPost.lottery',
                    'firstPost.lottery.options',
                    'firstPost.lottery.lotteryParticipants',
                ]);
            }
        )
        ->endpoint(
            Endpoint\Create::class,
            function (Endpoint\Create $endpoint): Endpoint\Endpoint {
                return $endpoint->after(function (Context $context, $data) {
                    $discussion = $context->model;
                    $payload = $discussion instanceof Discussion
                        ? PendingLotteryData::pull($discussion)
                        : null;

                    if ($payload && $discussion instanceof Discussion && $discussion->firstPost) {
                        resolve(\Flarum\Bus\Dispatcher::class)->dispatch(new CreateLottery(
                            $context->getActor(),
                            $discussion->firstPost,
                            $payload,
                        ));
                    }

                    return $data;
                });
            }
        ),

    (new Extend\ApiResource(Resource\PostResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('canStartLottery')
                ->get(fn (Post $post, Context $context) => $context->getActor()->can('startLottery', $post)),
            Schema\Arr::make('lotteryData')
                ->hidden()
                ->writableOnCreate()
                ->set(fn () => null),
            Schema\Relationship\ToOne::make('lottery')
                ->type('lotteries')
                ->includable(),
        ])
        ->endpoint(
            [
                Endpoint\Create::class,
                Endpoint\Show::class,
                Endpoint\Update::class,
            ],
            function (Endpoint\Create|Endpoint\Show|Endpoint\Update $endpoint): Endpoint\Endpoint {
                return $endpoint->addDefaultInclude([
                    'lottery',
                    'lottery.options',
                    'lottery.lotteryParticipants',
                ]);
            }
        ),

    (new Extend\ApiResource(Resource\ForumResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('canStartLottery')
                ->get(fn ($forum, Context $context) => $context->getActor()->can('discussion.lottery.start')),
        ]),

    (new Extend\ApiResource(Resource\UserResource::class))
        ->fields(fn () => [
            Schema\Integer::make('lotteryCount')
                ->get(fn (User $user) => Lottery::query()->where('user_id', $user->id)->count()),
        ]),

    (new Extend\Console())
        ->command(Console\RefreshParticipantsCountCommand::class)
        ->command(Console\DrawCommand::class)
        ->schedule(Console\DrawCommand::class, Console\DrawSchedule::class),

    (new Extend\Policy())
        ->modelPolicy(Lottery::class, Access\LotteryPolicy::class)
        ->modelPolicy(Post::class, Access\PostPolicy::class),

    (new Extend\Settings())
        ->default('nodeloc-lottery.maxOptions', 10)
        ->default('nodeloc-lottery.optionsColorBlend', true)
        ->default('nodeloc-lottery.coverImage', '/assets/covers/lottery_bg.png')
        ->serializeToForum('allowLotteryOptionImage', 'nodeloc-lottery.allowOptionImage', 'boolval')
        ->serializeToForum('lotteryMaxOptions', 'nodeloc-lottery.maxOptions', 'intval')
        ->serializeToForum('lotteryCoverImage', 'nodeloc-lottery.coverImage')
        ->registerLessConfigVar('nodeloc-lottery-options-color-blend', 'nodeloc-lottery.optionsColorBlend', function ($value) {
            return $value ? 'true' : 'false';
        }),

    (new Extend\Notification())
        ->type(DrawLotteryBlueprint::class, ['alert', 'email'])
        ->type(FailLotteryBlueprint::class, ['alert', 'email'])
        ->type(FinishLotteryBlueprint::class, ['alert', 'email']),

    (new Extend\ModelVisibility(Lottery::class))
        ->scope(Access\ScopeLotteryVisibility::class),
];
