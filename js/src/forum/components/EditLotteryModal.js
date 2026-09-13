import app from 'flarum/forum/app';

import Stream from 'flarum/common/utils/Stream';
import CreateLotteryModal from './CreateLotteryModal';

export default class EditLotteryModal extends CreateLotteryModal {
  oninit(vnode) {
    super.oninit(vnode);

    this.lottery = this.attrs.lottery;
    this.options = this.lottery.options() || [];
    this.operatorTypes = this.options.map((option) => Stream(option.operatorType()));
    this.operators = this.options.map((option) => Stream(option.operator()));
    this.operatorValues = this.options.map((option) => Stream(option.operatorValue()));
    this.prizes = Stream(this.lottery.prizes());
    this.price = Stream(this.lottery.price());
    this.amount = Stream(this.lottery.amount());
    this.endDate = Stream(this.formatDate(this.lottery.endDate()));
    this.allowCancelEnter = Stream(this.lottery.allowCancelEnter() || false);
    this.minParticipants = Stream(this.lottery.minParticipants() || 0);
    this.maxParticipants = Stream(this.lottery.maxParticipants() || 999999);
  }

  title() {
    return app.translator.trans('nodeloc-lottery.forum.modal.edit_title');
  }

  data() {
    if (this.endDate() && dayjs(this.endDate()).isAfter(dayjs(this.datepickerMaxDate))) {
      alert(app.translator.trans('nodeloc-lottery.forum.modal.end_date_too_far'));
      return null;
    }

    const options = this.operatorValues.map((value, index) => {
      const option = this.options[index];
      const data = option?.data ? { ...option.data } : { type: 'lottery-options' };

      data.attributes = {
        ...(data.attributes || {}),
        operatorType: this.operatorTypes[index](),
        operator: this.operators[index](),
        operatorValue: Number(value()),
      };

      return data;
    });

    return {
      prizes: this.prizes(),
      price: Number(this.price()),
      amount: Number(this.amount()),
      endDate: this.dateToTimestamp(this.endDate()),
      allowCancelEnter: this.allowCancelEnter(),
      minParticipants: Number(this.minParticipants()),
      maxParticipants: Number(this.maxParticipants()),
      options,
    };
  }

  onsubmit(event) {
    event.preventDefault();

    if (this.loading) {
      return;
    }

    const data = this.data();

    if (data === null) {
      return;
    }

    this.loading = true;

    return this.lottery
      .save(data)
      .then(() => {
        this.hide();
        m.redraw();
      })
      .catch((error) => {
        this.loaded();
        this.onerror(error);
      });
  }
}
