import app from 'flarum/forum/app';

import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LogInModal from 'flarum/forum/components/LogInModal';
import ItemList from 'flarum/common/utils/ItemList';
import Tooltip from 'flarum/common/components/Tooltip';
import EditLotteryModal from './EditLotteryModal';
import ListLotteryModal from './ListLotteryModal';
import EventCountDown from './EventCountDown';

export default class PostLottery extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.loadingOptions = false;
  }

  view() {
    const lottery = this.attrs.lottery;
    const options = lottery.options() || [];
    const infoItems = this.infoItems();
    const endDate = dayjs(lottery.endDate());
    const hasEntered = (lottery.lotteryParticipants() || []).length > 0;
    const minParticipants = lottery.minParticipants() || 0;
    const maxParticipants = lottery.maxParticipants() || 999999;
    const enterCount = lottery.enterCount() || 0;

    return (
      <div className="Post-lottery" data-id={lottery.data.id}>
        <div className="LotteryHeading">
          <h3 className="LotteryHeading-title">{lottery.prizes()}</h3>
          {lottery.canSeeParticipants() && (
            <Tooltip text={app.translator.trans('nodeloc-lottery.forum.public_lottery')}>
              <Button
                className="Button LotteryHeading-voters"
                onclick={this.showparticipants.bind(this)}
                icon="fas fa-user"
              />
            </Tooltip>
          )}
          {lottery.canEdit() && (
            <Tooltip text={app.translator.trans('nodeloc-lottery.forum.moderation.edit')}>
              <Button
                className="Button LotteryHeading-edit"
                onclick={app.modal.show.bind(app.modal, EditLotteryModal, { lottery })}
                icon="fas fa-pen"
              />
            </Tooltip>
          )}
          {lottery.canDelete() && (
            <Tooltip text={app.translator.trans('nodeloc-lottery.forum.moderation.delete')}>
              <Button
                className="Button LotteryHeading-delete"
                onclick={this.deleteLottery.bind(this)}
                icon="fas fa-trash"
              />
            </Tooltip>
          )}
        </div>

        <div>
          <div className="PrizeInfo">
            <div className="PrizeDetails">
              <span className="amount">{app.translator.trans('nodeloc-lottery.forum.modal.amount')} </span>
              <span>{lottery.amount()}</span>
              <span className="price">{app.translator.trans('nodeloc-lottery.forum.modal.price')} </span>
              <span>{lottery.price()}</span>
              {minParticipants !== 0 && (
                <>
                  <span className="min_participants">
                    {app.translator.trans('nodeloc-lottery.forum.modal.min_participants')}
                  </span>
                  <span>{minParticipants}</span>
                </>
              )}
              {maxParticipants < 999999 && (
                <>
                  <span className="max_participants">
                    {app.translator.trans('nodeloc-lottery.forum.modal.max_participants')}
                  </span>
                  <span>{maxParticipants}</span>
                </>
              )}
            </div>
            <EventCountDown id={lottery.data.id} endDate={endDate} />
          </div>

          <div className="LotteryOptions">
            {minParticipants > 0 &&
              enterCount > 0 &&
              m('.arrow', [
                m(
                  '.arrow-status',
                  {
                    style: {
                      width: `${Math.min(100, (enterCount / minParticipants) * 100)}%`,
                    },
                  },
                  m(
                    'span.arrow-pointer',
                    app.translator.trans('nodeloc-lottery.forum.participants_progress', {
                      current: enterCount,
                      minimum: minParticipants,
                    })
                  )
                ),
              ])}
            <h2>
              <i className="fas fa-info-circle fontawicon" />{' '}
              {app.translator.trans('nodeloc-lottery.forum.modal.options_label')}
            </h2>
            <ul>{options.map(this.viewOption.bind(this))}</ul>
          </div>

          <div className="Lottery-sticky">
            {!infoItems.isEmpty() && <div className="helpText LotteryInfoText">{infoItems.toArray()}</div>}
            {!hasEntered && !lottery.hasEnded() && lottery.canEnter() && (
              <Button
                className="Button Button--primary Lottery-submit"
                loading={this.loadingOptions}
                onclick={this.onsubmit.bind(this)}
              >
                {app.translator.trans('nodeloc-lottery.forum.lottery.submit_button')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  infoItems() {
    const items = new ItemList();
    const lottery = this.attrs.lottery;
    const hasEntered = (lottery.lotteryParticipants() || []).length > 0;

    if (app.session.user && !lottery.canEnter() && !lottery.hasEnded()) {
      items.add(
        'no-permission',
        <span>
          <i className="icon fas fa-times-circle fa-fw" />
          {app.translator.trans('nodeloc-lottery.forum.no_permission')}
        </span>
      );
    }

    if (lottery.endDate()) {
      items.add(
        'end-date',
        <span>
          <i className="icon fas fa-clock fa-fw" />
          {lottery.hasEnded()
            ? app.translator.trans('nodeloc-lottery.forum.lottery_ended')
            : app.translator.trans('nodeloc-lottery.forum.days_remaining', {
                time: dayjs(lottery.endDate()).fromNow(),
              })}
        </span>
      );
    }

    if (hasEntered) {
      items.add(
        'had-enter',
        <span>
          <i className="icon fas fa-check-double fa-fw" />
          {app.translator.trans('nodeloc-lottery.forum.had_enter')}
        </span>
      );
    }

    return items;
  }

  selectOptions = {
    discussions_started: app.translator.trans('nodeloc-lottery.forum.modal.discussions_started'),
    posts_made: app.translator.trans('nodeloc-lottery.forum.modal.posts_made'),
    points: app.translator.trans('nodeloc-lottery.forum.modal.points'),
    lotteries_made: app.translator.trans('nodeloc-lottery.forum.modal.lotteries_made'),
    read_permission: app.translator.trans('nodeloc-lottery.forum.modal.read_permission'),
  };

  viewOption(option) {
    const operatorText = this.selectOptions[option.operatorType()] || '';
    const operatorSymbol = option.operator() === 0 ? '<=' : '>=';

    return <li key={option.data.id}>{operatorText} {operatorSymbol} {option.operatorValue()}</li>;
  }

  onsubmit() {
    if (!app.session.user) {
      app.modal.show(LogInModal);
      return;
    }

    return this.submit();
  }

  submit() {
    this.loadingOptions = true;

    return app
      .request({
        method: 'PATCH',
        url: `${app.forum.attribute('apiUrl')}/lotteries/${this.attrs.lottery.data.id}/enter`,
      })
      .then((response) => {
        app.store.pushPayload(response);
      })
      .finally(() => {
        this.loadingOptions = false;
        m.redraw();
      });
  }

  showparticipants() {
    app.modal.show(ListLotteryModal, {
      lottery: this.attrs.lottery,
      post: this.attrs.post,
    });
  }

  deleteLottery() {
    if (confirm(app.translator.trans('nodeloc-lottery.forum.moderation.delete_confirm'))) {
      this.attrs.lottery.delete().then(() => m.redraw());
    }
  }
}
