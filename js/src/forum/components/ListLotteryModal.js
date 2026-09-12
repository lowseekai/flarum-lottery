import app from 'flarum/forum/app';

import Modal from 'flarum/common/components/Modal';
import avatar from 'flarum/common/helpers/avatar';
import username from 'flarum/common/helpers/username';
import Link from 'flarum/common/components/Link';
import Stream from 'flarum/common/utils/Stream';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

export default class ListLotteryModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = Stream(true);

    app.store
      .find('lotteries', this.attrs.lottery.data.id, {
        include: 'participants,participants.user',
      })
      .then(() => this.loading(false))
      .finally(() => m.redraw());
  }

  className() {
    return 'Modal--medium ParticipantsModal';
  }

  title() {
    return app.translator.trans(
      `nodeloc-lottery.forum.participants_modal.title${this.attrs.lottery.hasEnded() ? '_winners' : ''}`
    );
  }

  content() {
    return <div className="Modal-body">{this.loading() ? <LoadingIndicator /> : this.optionContent()}</div>;
  }

  optionContent() {
    const lottery = this.attrs.lottery;
    const participants = lottery.participants() || [];

    if (lottery.hasEnded()) {
      return (
        <div>
          <h2>
            {lottery.status() === 1
              ? app.translator.trans('nodeloc-lottery.forum.participants_modal.title_winners')
              : app.translator.trans('nodeloc-lottery.forum.participants_modal.lottery_canceled')}
          </h2>
          <div className="ParticipantsModal-option">
            {participants.length ? (
              <div className="ParticipantsModal-list">{participants.map(this.winnerContent.bind(this))}</div>
            ) : (
              <h4>{app.translator.trans('nodeloc-lottery.forum.modal.no_participants')}</h4>
            )}
          </div>
          <h2>{app.translator.trans('nodeloc-lottery.forum.participants_modal.title')}</h2>
          <div className="ParticipantsModal-option">
            {participants.length ? (
              <div className="ParticipantsModal-list">{participants.map(this.participantContent.bind(this))}</div>
            ) : (
              <h4>{app.translator.trans('nodeloc-lottery.forum.modal.no_participants')}</h4>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2>{app.translator.trans('nodeloc-lottery.forum.participants_modal.title')}</h2>
        <div className="ParticipantsModal-option">
          {participants.length ? (
            <div className="ParticipantsModal-list">{participants.map(this.participantContent.bind(this))}</div>
          ) : (
            <h4>{app.translator.trans('nodeloc-lottery.forum.modal.no_participants')}</h4>
          )}
        </div>
      </div>
    );
  }

  winnerContent(participant) {
    if (participant.status() !== 1) {
      return null;
    }

    return this.userLink(participant.user());
  }

  participantContent(participant) {
    return this.userLink(participant.user());
  }

  userLink(user) {
    if (!user) {
      return null;
    }

    return (
      <Link href={app.route.user(user)}>
        {avatar(user)} {username(user)}
      </Link>
    );
  }
}
