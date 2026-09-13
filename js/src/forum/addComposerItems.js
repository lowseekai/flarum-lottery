import app from 'flarum/forum/app';

import { extend } from 'flarum/common/extend';
import classList from 'flarum/common/utils/classList';

import CreateLotteryModal from './components/CreateLotteryModal';

export const addToComposer = (path) => {
  // Flarum 2 lazy-loads composer components, so resolve the module through
  // the extender instead of reading its prototype during boot.
  extend(path, 'oninit', function () {
    this.addLottery = () => {
      app.modal.show(CreateLotteryModal, {
        lottery: this.composer.fields.lottery,
        onsubmit: (lottery) => {
          this.composer.fields.lottery = lottery;
        },
      });
    };
  });

  extend(path, 'headerItems', function (items) {
    const discussion = this.composer.body?.attrs?.discussion;
    const canStartLottery = discussion?.canStartLottery() ?? app.forum.canStartLottery();

    if (canStartLottery) {
      items.add(
        'lottery',
        <a className="ComposerBody-lottery" onclick={this.addLottery}>
          <span className={classList('LotteryLabel', !this.composer.fields.lottery && 'none')}>
            {app.translator.trans(
              `nodeloc-lottery.forum.composer_discussion.${
                this.composer.fields.lottery ? 'edit' : 'add'
              }_lottery`
            )}
          </span>
        </a>,
        1
      );
    }
  });

  extend(path, 'data', function (data) {
    if (this.composer.fields.lottery) {
      data.lotteryData = this.composer.fields.lottery;
    }
  });
};

export default () => {
  addToComposer('flarum/forum/components/DiscussionComposer');
};
