<?php

/*
 * This file is part of nodeloc/lottery.
 *
 * Copyright (c) Nodeloc.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Nodeloc\Lottery\Listeners;

use Flarum\Discussion\Event\Saving;
use Nodeloc\Lottery\LotteryTitle;

class SaveLotteryToDiscussion
{
        /**
     * @param Saving $event
     */
    public function handle(Saving $event)
    {
        if (isset($event->data['attributes']['lotteryData'])) {
            $discussion = $event->discussion;
            $discussion->is_lottery = true;
            $discussion->title = LotteryTitle::active($discussion->title);
        }
    }
}
