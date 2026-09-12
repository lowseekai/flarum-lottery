<?php

namespace Nodeloc\Lottery\Console;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Notification\NotificationSyncer;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Nodeloc\Lottery\Lottery;
use Nodeloc\Lottery\Notification\DrawLotteryBlueprint;
use Nodeloc\Lottery\Notification\FailLotteryBlueprint;
use Nodeloc\Lottery\Notification\FinishLotteryBlueprint;
use Ramon\PointSystem\Model\PointTransaction;
use Ramon\PointSystem\Repository\PointsRepository;
use Symfony\Contracts\Translation\TranslatorInterface;

class DrawCommand extends Command
{
    protected $signature = 'nodeloc:lottery:draw';
    protected $description = 'Draw lottery by date.';
    protected $prefix = 'Lottery #';

    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected NotificationSyncer $notifications,
        protected TranslatorInterface $translator,
        protected PointsRepository $points,
    ) {
        parent::__construct();
    }

    public function handle(): void
    {
        $lotteries = Lottery::query()
            ->where('status', 0)
            ->whereNotNull('end_date')
            ->where('end_date', '<', Carbon::now())
            ->get();

        foreach ($lotteries as $lottery) {
            $successful = false;
            $winners = new Collection();

            $lottery->getConnection()->transaction(function () use ($lottery, &$successful, &$winners): void {
                $lottery = Lottery::query()
                    ->whereKey($lottery->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lottery || (int) $lottery->status !== 0 || ! $lottery->end_date || $lottery->end_date->isFuture()) {
                    return;
                }

                $participants = $lottery->participants()->with('user')->get();
                $minParticipants = (int) $lottery->min_participants;

                if ($participants->count() >= $minParticipants) {
                    $successful = true;
                    $winners = $lottery->participants()
                        ->inRandomOrder()
                        ->limit(max(0, (int) $lottery->amount))
                        ->get();

                    $winnerIds = $winners->pluck('id')->all();
                    if ($winnerIds) {
                        $lottery->participants()
                            ->whereIn('id', $winnerIds)
                            ->update(['status' => 1]);
                    }

                    $lottery->update(['status' => 1]);

                    $totalEntranceFee = $participants->count() * max(0, (int) $lottery->price);
                    if ($lottery->user && $totalEntranceFee > 0) {
                        $this->points->award(
                            $lottery->user,
                            $totalEntranceFee,
                            'lottery.host_reward',
                            'lottery',
                            (int) $lottery->id,
                            ['participant_count' => $participants->count()]
                        );
                    }

                } else {
                    $lottery->update(['status' => 2]);
                    $price = max(0, (int) $lottery->price);

                    if ($price > 0) {
                        foreach ($participants as $participant) {
                            $user = $participant->user;

                            if (
                                ! $user
                                || ! $this->hasEntryDebit($user, (int) $lottery->id)
                                || $this->hasRefundCredit($user, (int) $lottery->id)
                            ) {
                                continue;
                            }

                            $this->points->award(
                                $user,
                                $price,
                                'lottery.entry.refund',
                                'lottery',
                                (int) $lottery->id,
                                ['source_reason' => 'lottery.entry']
                            );
                        }
                    }
                }
            });

            $discussion = Discussion::query()
                ->where('first_post_id', $lottery->post_id)
                ->first();

            if (! $discussion) {
                $this->info($lottery->id.' completed without a linked discussion.');
                continue;
            }

            if ($successful) {
                $this->notifications->sync(new FinishLotteryBlueprint($discussion), [$discussion->user]);

                $recipients = User::query()
                    ->whereIn('id', $winners->pluck('user_id')->all())
                    ->get()
                    ->all();

                if ($recipients) {
                    $this->notifications->sync(
                        new DrawLotteryBlueprint($discussion, $discussion->user),
                        $recipients
                    );
                }

                $this->info($lottery->id.' drawn successfully.');
            } else {
                $this->notifications->sync(new FailLotteryBlueprint($discussion), [$discussion->user]);
                $this->info($lottery->id.' canceled due to insufficient participants.');
            }
        }

        $this->info('Done.');
    }

    protected function hasEntryDebit(User $user, int $lotteryId): bool
    {
        return PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('reason', 'lottery.entry')
            ->where('reference_type', 'lottery')
            ->where('reference_id', $lotteryId)
            ->where('amount', '<', 0)
            ->exists();
    }

    protected function hasRefundCredit(User $user, int $lotteryId): bool
    {
        return PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('reason', 'lottery.entry.refund')
            ->where('reference_type', 'lottery')
            ->where('reference_id', $lotteryId)
            ->where('amount', '>', 0)
            ->exists();
    }

    public function info($string, $verbosity = null): void
    {
        parent::info($this->prefix.' | '.$string, $verbosity);
    }
}
