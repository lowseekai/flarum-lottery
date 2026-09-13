import app from 'flarum/forum/app';

import Component from 'flarum/common/Component';

function lotteryCoverImage() {
  const configured = app.forum.attribute('lotteryCoverImage');
  const cover = typeof configured === 'string' && configured.trim() ? configured.trim() : '/assets/covers/lottery_bg.png';

  if (/^\/(?!\/)[^\s"'`()]+$/.test(cover) || /^https?:\/\/[^\s"'`()]+$/i.test(cover)) {
    return cover;
  }

  return '/assets/covers/lottery_bg.png';
}

export default class LotteryPreview extends Component {
  selectOptions = {
    discussions_started: app.translator.trans('nodeloc-lottery.forum.modal.discussions_started'),
    posts_made: app.translator.trans('nodeloc-lottery.forum.modal.posts_made'),
    points: app.translator.trans('nodeloc-lottery.forum.modal.points'),
  };

  view() {
    const lottery = this.attrs.lottery;

    if (!lottery) {
      return null;
    }

    const options = Array.isArray(lottery.options) ? lottery.options : [];
    const endDate = lottery.endDate && dayjs(lottery.endDate).isValid() ? dayjs(lottery.endDate).format('YYYY-MM-DD HH:mm') : null;

    return (
      <div className="LotteryPreview">
        <div
          className="LotteryPreview-cover"
          style={{
            backgroundImage: `linear-gradient(rgba(28, 28, 28, 0.42), rgba(0, 0, 0, 0.58)), url("${lotteryCoverImage()}")`,
          }}
        />
        <div className="LotteryPreview-header">
          <div>
            <div className="LotteryPreview-kicker">
              <i className="icon fas fa-gift" aria-hidden="true" />
              <span>{app.translator.trans('nodeloc-lottery.forum.modal.preview_title')}</span>
            </div>
            <h3 className="LotteryPreview-title">{lottery.prizes}</h3>
          </div>
          <span className="LotteryPreview-status">{app.translator.trans('nodeloc-lottery.forum.modal.preview_status')}</span>
        </div>

        <div className="LotteryPreview-details">
          <div className="LotteryPreview-detail">
            <span className="LotteryPreview-detailLabel">{app.translator.trans('nodeloc-lottery.forum.modal.price')}</span>
            <strong>{lottery.price}</strong>
          </div>
          <div className="LotteryPreview-detail">
            <span className="LotteryPreview-detailLabel">{app.translator.trans('nodeloc-lottery.forum.modal.amount')}</span>
            <strong>{lottery.amount}</strong>
          </div>
          {endDate && (
            <div className="LotteryPreview-detail">
              <span className="LotteryPreview-detailLabel">{app.translator.trans('nodeloc-lottery.forum.modal.date_placeholder')}</span>
              <strong>{endDate}</strong>
            </div>
          )}
          {(lottery.minParticipants > 0 || lottery.maxParticipants < 999999) && (
            <div className="LotteryPreview-detail">
              <span className="LotteryPreview-detailLabel">{app.translator.trans('nodeloc-lottery.forum.modal.participants_label')}</span>
              <strong>
                {lottery.minParticipants || 0} -{' '}
                {lottery.maxParticipants < 999999 ? lottery.maxParticipants : app.translator.trans('nodeloc-lottery.forum.modal.preview_unlimited')}
              </strong>
            </div>
          )}
        </div>

        <div className="LotteryPreview-conditions">
          <div className="LotteryPreview-sectionTitle">
            <i className="icon fas fa-filter" aria-hidden="true" />
            <span>{app.translator.trans('nodeloc-lottery.forum.modal.options_label')}</span>
          </div>
          <ul>
            {options.map((option, index) => {
              const operatorText = this.selectOptions[option.operatorType] || option.operatorType;
              const operatorSymbol = Number(option.operator) === 0 ? '<=' : '>=';

              return (
                <li key={index}>
                  {operatorText} {operatorSymbol} {option.operatorValue}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}
