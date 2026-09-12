<?php

namespace Nodeloc\Lottery\Api;

use Flarum\Discussion\Discussion;
use WeakMap;

/**
 * Carries the lottery payload from DiscussionResource creation to its
 * post-creation hook. Flarum 2 creates the first post internally and only
 * forwards the content field to PostResource.
 */
final class PendingLotteryData
{
    private static ?WeakMap $payloads = null;

    public static function set(Discussion $discussion, array $payload): void
    {
        self::$payloads ??= new WeakMap();
        self::$payloads[$discussion] = $payload;
    }

    public static function pull(Discussion $discussion): ?array
    {
        if (! self::$payloads || ! isset(self::$payloads[$discussion])) {
            return null;
        }

        $payload = self::$payloads[$discussion];
        unset(self::$payloads[$discussion]);

        return $payload;
    }
}
