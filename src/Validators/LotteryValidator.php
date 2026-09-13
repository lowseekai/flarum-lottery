<?php

/*
 * This file is part of nodeloc/lottery.
 *
 * Copyright (c) Nodeloc.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Nodeloc\Lottery\Validators;

use Carbon\Carbon;
use Flarum\Foundation\AbstractValidator;
use Flarum\Locale\TranslatorInterface;
use Illuminate\Support\Fluent;
use Illuminate\Validation\Rule;

class LotteryValidator extends AbstractValidator
{
    protected function getRules(): array
    {
        return [
            'prizes'   => 'required',
            'price'   => 'required',
            'amount'   => 'required',
            'endDate'    => [
                'nullable',
                // max of 'timestamp' SQL column is 2038-01-18
                Rule::when(function (Fluent $input) {
                    return !is_bool($input->get('endDate'));
                }, 'date|after:now|before:2038-01-18'),
                function ($attribute, $value, $fail) {
                    if (is_bool($value) || $value === null || $value === '') {
                        return;
                    }

                    try {
                        $date = Carbon::parse($value);
                    } catch (\Throwable) {
                        return;
                    }

                    if ($date->isAfter(Carbon::now()->addDays(3))) {
                        $fail(resolve(TranslatorInterface::class)->trans('nodeloc-lottery.forum.modal.end_date_too_far'));
                    }
                },
            ],
        ];
    }
}
