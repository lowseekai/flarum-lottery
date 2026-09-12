import app from 'flarum/forum/app';

import Button from 'flarum/common/components/Button';
import Modal from 'flarum/common/components/Modal';
import ItemList from 'flarum/common/utils/ItemList';
import Stream from 'flarum/common/utils/Stream';
import extractText from 'flarum/common/utils/extractText';
import Select from 'flarum/common/components/Select';

export default class CreateLotteryModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.operatorTypes = [Stream('discussions_started')];
    this.operators = [Stream(1)];
    this.operatorValues = [Stream(1)];
    this.prizes = Stream('');
    this.price = Stream('');
    this.amount = Stream('');
    this.endDate = Stream();
    this.allowCancelEnter = Stream(true);
    this.minParticipants = Stream(0);
    this.maxParticipants = Stream(999999);
    this.datepickerMinDate = this.formatDate(undefined);

    const { lottery } = this.attrs;

    if (lottery && Array.isArray(lottery.options)) {
      this.operatorTypes = [];
      this.operators = [];
      this.operatorValues = [];

      lottery.options.forEach((option) => {
        this.operatorTypes.push(Stream(option.operatorType));
        this.operators.push(Stream(option.operator));
        this.operatorValues.push(Stream(option.operatorValue));
      });

      this.prizes(lottery.prizes);
      this.price(lottery.price);
      this.amount(lottery.amount);
      this.allowCancelEnter(lottery.allowCancelEnter);
      this.minParticipants(lottery.minParticipants || 0);
      this.maxParticipants(lottery.maxParticipants || 999999);
      this.endDate(this.formatDate(lottery.endDate));

      if (this.endDate() && dayjs(lottery.endDate).isAfter(dayjs())) {
        this.datepickerMinDate = this.formatDate(lottery.endDate);
      }
    }
  }

  title() {
    return app.translator.trans('nodeloc-lottery.forum.modal.add_title');
  }

  className() {
    return 'LotteryDiscussionModal Modal--medium';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="LotteryDiscussionModal-form">{this.fields().toArray()}</div>
      </div>
    );
  }

  fields() {
    const items = new ItemList();

    items.add(
      'prizes',
      <div className="Form-group">
        <label className="label">{app.translator.trans('nodeloc-lottery.forum.modal.lottery_placeholder')}</label>
        <input type="text" name="prizes" className="FormControl" bidi={this.prizes} />
      </div>,
      100
    );

    items.add(
      'price',
      <div className="Form-group">
        <label className="label">{app.translator.trans('nodeloc-lottery.forum.modal.price')}</label>
        <input type="number" min="0" name="price" className="FormControl" bidi={this.price} />
      </div>,
      100
    );

    items.add(
      'amount',
      <div className="Form-group">
        <label className="label">{app.translator.trans('nodeloc-lottery.forum.modal.amount')}</label>
        <input type="number" min="1" name="amount" className="FormControl" bidi={this.amount} />
      </div>,
      100
    );

    items.add(
      'conditions',
      <div className="LotteryModal--answers Form-group">
        <label className="label LotteryModal--answers-title">
          <span>{app.translator.trans('nodeloc-lottery.forum.modal.options_label')}</span>
          {Button.component({
            className: 'Button LotteryModal--button small',
            icon: 'fas fa-plus',
            onclick: this.addOption.bind(this),
          })}
        </label>
        {this.displayOptions()}
      </div>,
      80
    );

    items.add(
      'date',
      <div className="Form-group">
        <label className="label">{app.translator.trans('nodeloc-lottery.forum.modal.date_placeholder')}</label>
        <div className="LotteryModal--date">
          <input
            className="FormControl"
            type="datetime-local"
            name="date"
            bidi={this.endDate}
            min={this.datepickerMinDate}
            max={this.formatDate('2038')}
          />
          {Button.component({
            className: 'Button LotteryModal--button',
            icon: 'fas fa-times',
            onclick: this.endDate.bind(this, null),
          })}
        </div>
        {this.endDate() && (
          <p className="helpText">
            <i class="icon fas fa-clock" />
            &nbsp;
            {dayjs(this.endDate()).isBefore(dayjs())
              ? app.translator.trans('nodeloc-lottery.forum.lottery_ended')
              : app.translator.trans('nodeloc-lottery.forum.days_remaining', {
                  time: dayjs(this.endDate()).fromNow(),
                })}
          </p>
        )}
      </div>,
      40
    );

    items.add(
      'min-participants',
      <div className="Form-group MinMaxSelector">
        <label className="label">{app.translator.trans('nodeloc-lottery.forum.modal.participants_help')}</label>
        <div class="MinMaxSelector--inputs">
          <input type="number" min="0" name="min_participants" className="FormControl" bidi={this.minParticipants} />
          <button class="Button hasIcon" type="button">
            <i aria-hidden="true" class="icon fas fa-less-than-equal Button-icon" />
            <span class="Button-label" />
          </button>
          <input
            class="FormControl MinMaxSelector--placeholder"
            disabled
            placeholder={app.translator.trans('nodeloc-lottery.forum.modal.participants_label')}
          />
          <button class="Button hasIcon" type="button">
            <i aria-hidden="true" class="icon fas fa-less-than-equal Button-icon" />
            <span class="Button-label" />
          </button>
          <input type="number" max="999999" name="max_participants" className="FormControl" bidi={this.maxParticipants} />
        </div>
      </div>,
      15
    );

    items.add(
      'submit',
      <div className="Form-group">
        {Button.component(
          {
            type: 'submit',
            className: 'Button Button--primary LotteryModal-SubmitButton',
            loading: this.loading,
          },
          app.translator.trans('nodeloc-lottery.forum.modal.submit')
        )}
      </div>,
      -10
    );

    return items;
  }

  selectOptions = {
    discussions_started: app.translator.trans('nodeloc-lottery.forum.modal.discussions_started'),
    posts_made: app.translator.trans('nodeloc-lottery.forum.modal.posts_made'),
    points: app.translator.trans('nodeloc-lottery.forum.modal.points'),
    lotteries_made: app.translator.trans('nodeloc-lottery.forum.modal.lotteries_made'),
    read_permission: app.translator.trans('nodeloc-lottery.forum.modal.read_permission'),
  };

  displayOptions() {
    return this.operatorValues.map((value, i) => (
      <div className="Form-group MinMaxSelector" key={i}>
        <fieldset className="MinMaxSelector--inputs">
          <span class="Select">
            {Select.component({
              options: this.selectOptions,
              value: this.operatorTypes[i](),
              onchange: (selected) => this.operatorTypes[i](selected),
            })}
          </span>
          <button
            class="Button hasIcon"
            type="button"
            onclick={() => this.operators[i](this.operators[i]() === 0 ? 1 : 0)}
          >
            {this.operators[i]() === 0 ? (
              <i aria-hidden="true" class="icon fas fa-less-than-equal Button-icon" />
            ) : (
              <i aria-hidden="true" class="icon fas fa-greater-than-equal Button-icon" />
            )}
            <span class="Button-label" />
          </button>
          <input
            className="FormControl"
            type="number"
            name={`operatorvalue${i + 1}`}
            bidi={value}
            placeholder={`${extractText(app.translator.trans('nodeloc-lottery.forum.modal.option_placeholder'))} #${i + 1}`}
          />
        </fieldset>
        {i >= 2 &&
          Button.component({
            type: 'button',
            className: 'Button Button--warning LotteryModal--button',
            icon: 'fas fa-minus',
            onclick: this.removeOption.bind(this, i),
          })}
      </div>
    ));
  }

  addOption() {
    const max = 5;

    if (this.operatorValues.length < max) {
      this.operatorTypes.push(Stream('points'));
      this.operators.push(Stream(1));
      this.operatorValues.push(Stream(1));
    } else {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.max', { max })));
    }
  }

  removeOption(index) {
    this.operatorTypes.splice(index, 1);
    this.operators.splice(index, 1);
    this.operatorValues.splice(index, 1);
  }

  data() {
    const lottery = {
      prizes: this.prizes(),
      price: Number(this.price()),
      amount: Number(this.amount()),
      endDate: this.dateToTimestamp(this.endDate()),
      allowCancelEnter: this.allowCancelEnter(),
      minParticipants: Number(this.minParticipants()),
      maxParticipants: Number(this.maxParticipants()),
      options: [],
    };

    this.operatorValues.forEach((value, index) => {
      if (value() !== '' && value() !== null && value() !== undefined) {
        lottery.options.push({
          operatorType: this.operatorTypes[index](),
          operator: this.operators[index](),
          operatorValue: Number(value()),
        });
      }
    });

    if (!lottery.prizes) {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.include_prizes')));
      return null;
    }
    if (this.price() === '') {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.include_price')));
      return null;
    }
    if (this.amount() === '') {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.include_amount')));
      return null;
    }
    if (lottery.options.length < 1) {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.min')));
      return null;
    }
    if (!this.endDate()) {
      alert(extractText(app.translator.trans('nodeloc-lottery.forum.modal.include_end_date')));
      return null;
    }

    return lottery;
  }

  onsubmit(event) {
    event.preventDefault();

    const data = this.data();

    if (data === null) {
      return;
    }

    const promise = this.attrs.onsubmit(data);

    if (promise instanceof Promise) {
      this.loading = true;

      promise.then(this.hide.bind(this), (error) => {
        console.error(error);
        this.onerror(error);
        this.loaded();
      });
    } else {
      app.modal.close();
    }
  }

  formatDate(date, fallback = false) {
    const dayjsDate = dayjs(date);

    if (date === false || !dayjsDate.isValid()) {
      return fallback !== false ? this.formatDate(fallback) : null;
    }

    return dayjsDate.format('YYYY-MM-DDTHH:mm');
  }

  dateToTimestamp(date) {
    const dayjsDate = dayjs(date);

    return !date || !dayjsDate.isValid() ? false : dayjsDate.format();
  }
}
