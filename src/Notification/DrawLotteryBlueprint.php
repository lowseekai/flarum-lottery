<?php

namespace Nodeloc\Lottery\Notification;

use Flarum\Database\AbstractModel;
use Flarum\Discussion\Discussion;
use Flarum\Locale\TranslatorInterface;
use Flarum\Notification\AlertableInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;

class DrawLotteryBlueprint implements BlueprintInterface, AlertableInterface, MailableInterface
{
    public function __construct(
        public Discussion $discussion,
        public User $actor
    ) {
    }

    /**
     * Get the user that sent the notification.
     */
    public function getFromUser(): ?User
    {
        return $this->discussion->user;
    }

    /**
     * Get the model that is the subject of this activity.
     */
    public function getSubject(): ?AbstractModel
    {
        return $this->discussion;
    }

    /**
     * Get the data to be stored in the notification.
     */
    public function getData(): array
    {
        return [];
    }

    /**
     * Get the serialized type of this activity.
     *
     * @return string
     */
    public static function getType(): string
    {
        return 'drawLottery';
    }

    /**
     * Get the name of the model class for the subject of this activity.
     *
     * @return string
     */
    public static function getSubjectModel(): string
    {
        return Discussion::class;
    }

    /**
     * Get the name of the view to construct a notification email with.
     *
     * @return array{text?: string, html?: string}
     */
    public function getEmailViews(): array
    {
        return [
            'text' => 'nodeloc-lottery::emails.drawLottery',
            'html' => 'nodeloc-lottery::emails.drawLottery',
        ];
    }

    /**
     * Get the subject line for a notification email.
     *
     * @return string
     */
    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('nodeloc-lottery.email.subject.drawLottery', [
            '{discussion_title}' => $this->discussion->title,
        ]);
    }
}
