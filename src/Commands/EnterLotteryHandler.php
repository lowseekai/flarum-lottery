<?php

/*
 * This file is part of nodeloc/lottery.
 *
 * Copyright (c) Nodeloc.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Nodeloc\Lottery\Commands;

use DomainException;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\TranslatorInterface;
use Flarum\User\User;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\ConnectionResolverInterface;
use Nodeloc\Lottery\Events\LotteryWasEntered;
use Nodeloc\Lottery\Lottery;
use Nodeloc\Lottery\LotteryRepository;
use Ramon\PointSystem\Repository\PointsRepository;

class EnterLotteryHandler
{
    public function __construct(
        protected LotteryRepository $lottery,
        protected Dispatcher $events,
        protected ConnectionResolverInterface $db,
        protected PointsRepository $points,
        protected TranslatorInterface $translator,
    ) {
    }

    /**
     * @throws ValidationException
     */
    public function handle(EnterLottery $command): Lottery
    {
        $actor = $command->actor;
        $lottery = $this->lottery->findOrFail($command->lotteryId, $actor);

        $actor->assertCan('enter', $lottery);

        if ($lottery->participants()->where('user_id', $actor->id)->exists()) {
            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.composer_discussion.in_queue_alert'),
            ]);
        }

        $discussionId = $lottery->post->discussion_id;
        $userPostedInDiscussion = $actor->posts()
            ->where('discussion_id', $discussionId)
            ->exists();

        if (! $userPostedInDiscussion) {
            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.composer_discussion.no_post_in_discussion_alert'),
            ]);
        }

        $maxParticipants = (int) ($lottery->max_participants ?: 999999);
        if ((int) $lottery->enter_count >= $maxParticipants) {
            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.too_many_participants'),
            ]);
        }

        $this->userMeetsConditions($actor, $lottery);

        $price = max(0, (int) $lottery->price);
        if ($price > $this->points->getOrCreate($actor)->balance) {
            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.modal.not_enough').' '
                    .$this->translator->trans('nodeloc-lottery.forum.modal.points'),
            ]);
        }

        try {
            $this->db->connection()->transaction(function () use ($lottery, $actor, $price): void {
                $lottery = Lottery::query()
                    ->whereKey($lottery->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lottery->hasEnded()) {
                    throw new ValidationException([
                        'lottery' => $this->translator->trans('nodeloc-lottery.forum.lottery_ended'),
                    ]);
                }

                if ($lottery->participants()->where('user_id', $actor->id)->exists()) {
                    throw new ValidationException([
                        'lottery' => $this->translator->trans('nodeloc-lottery.forum.composer_discussion.in_queue_alert'),
                    ]);
                }

                $maxParticipants = (int) ($lottery->max_participants ?: 999999);
                if ((int) $lottery->enter_count >= $maxParticipants) {
                    throw new ValidationException([
                        'lottery' => $this->translator->trans('nodeloc-lottery.forum.too_many_participants'),
                    ]);
                }

                if ($price > 0) {
                    $this->points->deduct(
                        $actor,
                        $price,
                        'lottery.entry',
                        'lottery',
                        (int) $lottery->id
                    );
                }

                $participant = $lottery->participants()->create([
                    'user_id' => $actor->id,
                    'status' => 0,
                ]);

                $this->events->dispatch(new LotteryWasEntered($actor, $lottery, $participant));
                $lottery->increment('enter_count');
            });
        } catch (DomainException) {
            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.modal.not_enough').' '
                    .$this->translator->trans('nodeloc-lottery.forum.modal.points'),
            ]);
        }

        return $lottery->fresh(['options', 'participants', 'post', 'user']);
    }

    protected function userMeetsConditions(User $user, Lottery $lottery): void
    {
        foreach ($lottery->options as $condition) {
            $this->checkCondition($user, $condition);
        }
    }

    protected function checkCondition(User $user, object $condition): void
    {
        $operatorType = (string) $condition->getAttribute('operator_type');
        $value = $this->getConditionValue($user, $operatorType);
        $operator = (int) $condition->getAttribute('operator');
        $threshold = (int) $condition->getAttribute('operator_value');

        if (! $this->meetsCondition($value, $operator, $threshold)) {
            $errorMessageKey = "nodeloc-lottery.forum.modal.$operatorType";

            throw new ValidationException([
                'lottery' => $this->translator->trans('nodeloc-lottery.forum.modal.not_enough').' '
                    .$this->translator->trans($errorMessageKey),
            ]);
        }
    }

    protected function getConditionValue(User $user, string $operatorType): int
    {
        return match ($operatorType) {
            'discussions_started' => $user->discussions()
                ->where('is_private', false)
                ->count(),
            'posts_made' => $user->posts()
                ->where('type', 'comment')
                ->where('is_private', false)
                ->count(),
            // "money" is retained as a read-only compatibility alias for
            // old lottery rows. It now reads the Point System balance.
            'points', 'money' => $this->points->getOrCreate($user)->balance,
            'lotteries_made' => Lottery::where('user_id', $user->id)->count(),
            'read_permission' => $user->groups()->count() > 0
                ? (int) $user->groups()->orderByDesc('read_permission')->first()->read_permission
                : 0,
            default => 0,
        };
    }

    protected function meetsCondition(int $count, int $operator, int $value): bool
    {
        return $operator === 0 ? $count <= $value : $count >= $value;
    }
}
