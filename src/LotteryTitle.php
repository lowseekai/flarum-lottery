<?php

namespace Nodeloc\Lottery;

class LotteryTitle
{
    public const ACTIVE_PREFIX = '[抽奖中]';
    public const ENDED_PREFIX = '[抽奖已结束]';

    public static function active(string $title): string
    {
        return self::withPrefix($title, self::ACTIVE_PREFIX);
    }

    public static function ended(string $title): string
    {
        return self::withPrefix($title, self::ENDED_PREFIX);
    }

    protected static function withPrefix(string $title, string $prefix): string
    {
        $title = trim($title);
        $title = preg_replace('/^(?:\[(?:抽奖中|抽奖已结束)\]\s*)+/u', '', $title) ?? $title;

        return $prefix.($title === '' ? '' : ' '.$title);
    }
}
