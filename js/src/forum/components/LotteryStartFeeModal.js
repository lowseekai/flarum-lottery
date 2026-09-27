import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import Modal from 'flarum/common/components/Modal';

export default class LotteryStartFeeModal extends Modal {
  className() {
    return 'LotteryStartFeeModal Modal--small';
  }

  title() {
    return app.translator.trans('nodeloc-lottery.forum.modal.confirm_start_fee_title');
  }

  content() {
    const fee = Number(this.attrs.fee || 0);

    return (
      <div className="Modal-body">
        <p>{app.translator.trans('nodeloc-lottery.forum.modal.confirm_start_fee', { fee })}</p>
        <div className="Form-group">
          {Button.component({ className: 'Button Button--primary', onclick: () => { this.hide(); this.attrs.onconfirm(); } }, app.translator.trans('nodeloc-lottery.forum.modal.confirm_start_fee_action'))}
          {Button.component({ className: 'Button', onclick: this.hide.bind(this) }, app.translator.trans('nodeloc-lottery.forum.modal.confirm_start_fee_cancel'))}
        </div>
      </div>
    );
  }
}
