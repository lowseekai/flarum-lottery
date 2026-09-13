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

use Carbon\Carbon;
use Flarum\Settings\SettingsRepositoryInterface;
use Nodeloc\Lottery\Events\SavingLotteryAttributes;
use Nodeloc\Lottery\LotteryRepository;
use Nodeloc\Lottery\Validators\LotteryOptionValidator;
use Nodeloc\Lottery\Validators\LotteryValidator;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Arr;

class EditLotteryHandler
{
    /**
     * @var LotteryValidator
     */
    protected $validator;

    /**
     * @var LotteryOptionValidator
     */
    protected $optionValidator;

    /**
     * @var Dispatcher
     */
    protected $events;

    /**
     * @var SettingsRepositoryInterface
     */
    protected $settings;

    /**
     * @var LotteryRepository
     */
    protected $lottery;

    public function __construct(LotteryRepository $lottery, LotteryValidator $validator, LotteryOptionValidator $optionValidator, Dispatcher $events, SettingsRepositoryInterface $settings)
    {
        $this->validator = $validator;
        $this->optionValidator = $optionValidator;
        $this->events = $events;
        $this->settings = $settings;
        $this->lottery = $lottery;
    }

    public function handle(EditLottery $command)
    {
        $lottery = $this->lottery->findOrFail($command->lotteryId, $command->actor);

        $command->actor->assertCan('edit', $lottery);

        $attributes = (array) Arr::get($command->data, 'attributes');
        $optionsProvided = array_key_exists('options', $attributes);
        $options = collect($optionsProvided ? Arr::get($attributes, 'options', []) : []);

        $this->validator->assertValid($attributes);

        if (isset($attributes['prizes'])) {
            $lottery->prizes = $attributes['prizes'];
        }

        if (isset($attributes['price'])) {
            $lottery->price = $attributes['price'];
        }
        if (isset($attributes['amount'])) {
            $lottery->amount = $attributes['amount'];
        }
        if (array_key_exists('minParticipants', $attributes) || array_key_exists('min_participants', $attributes)) {
            $lottery->min_participants = $attributes['minParticipants'] ?? $attributes['min_participants'];
        }
        if (array_key_exists('maxParticipants', $attributes) || array_key_exists('max_participants', $attributes)) {
            $lottery->max_participants = $attributes['maxParticipants'] ?? $attributes['max_participants'];
        }
        if (array_key_exists('allowCancelEnter', $attributes)
            || array_key_exists('allow_cancel_enter', $attributes)
            || array_key_exists('can_cancel_enter', $attributes)) {
            $lottery->can_cancel_enter = (bool) (
                $attributes['allowCancelEnter']
                ?? $attributes['allow_cancel_enter']
                ?? $attributes['can_cancel_enter']
            );
        }

        if (isset($attributes['endDate'])) {
            $endDate = $attributes['endDate'];

            if (is_string($endDate)) {
                $date = Carbon::parse($endDate);

                if (!$lottery->hasEnded() && $date->isFuture()) {
                    $lottery->end_date = $date->setTimezone('Asia/Shanghai');
                }
            } elseif (is_bool($endDate) && !$endDate) {
                $lottery->end_date = null;
            }
        }

        $this->events->dispatch(new SavingLotteryAttributes($command->actor, $lottery, $attributes, $command->data));

        $lottery->save();

        // Remove options omitted by the editor, including when only one remains.
        if ($optionsProvided) {
            $ids = $options
                ->pluck('id')
                ->filter(fn ($id) => $id !== null && $id !== '')
                ->values()
                ->all();

            if ($ids) {
                $lottery->options()->whereNotIn('id', $ids)->delete();
            } else {
                $lottery->options()->delete();
            }
        }

        // update + add new options
        foreach ($options as $key => $opt) {
            $id = Arr::get($opt, 'id');

            $optionAttributes = [
                'operator_type' => Arr::get($opt, 'attributes.operatorType', Arr::get($opt, 'attributes.operator_type')),
                'operator' => Arr::get($opt, 'attributes.operator'),
                'operator_value' => Arr::get($opt, 'attributes.operatorValue', Arr::get($opt, 'attributes.operator_value')),
            ];

            $this->optionValidator->assertValid($optionAttributes);

            $lottery->options()->updateOrCreate([
                'id' => $id,
            ], [
                'operator_type'    => Arr::get($optionAttributes, 'operator_type'),
                'operator' => Arr::get($optionAttributes, 'operator'),
                'operator_value' => Arr::get($optionAttributes, 'operator_value'),
            ]);
        }

        return $lottery;
    }
}
