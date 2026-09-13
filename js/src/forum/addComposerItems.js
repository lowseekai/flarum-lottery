import app from 'flarum/forum/app';

import { extend } from 'flarum/common/extend';
import classList from 'flarum/common/utils/classList';

import CreateLotteryModal from './components/CreateLotteryModal';
import LotteryPreview from './components/LotteryPreview';

const discussionComposer = 'flarum/forum/components/DiscussionComposer';

export const addToComposer = (composer = discussionComposer) => {
  // DiscussionComposer is lazy-loaded in Flarum 2, so register these hooks by
  // module path instead of reading its prototype during forum startup.
  extend(composer, 'headerItems', function (items) {
    const discussion = this.composer.body?.attrs?.discussion;
    const canStartLottery = discussion?.canStartLottery() ?? app.forum.canStartLottery();

    if (canStartLottery) {
      items.add(
        'lottery',
        <a
          className="ComposerBody-lottery"
          onclick={() =>
            app.modal.show(CreateLotteryModal, {
              lottery: this.composer.fields.lottery,
              onsubmit: (lottery) => {
                this.composer.fields.lottery = lottery;
                m.redraw();
              },
            })
          }
        >
          <span className={classList('LotteryLabel', !this.composer.fields.lottery && 'none')}>
            {app.translator.trans(`nodeloc-lottery.forum.composer_discussion.${this.composer.fields.lottery ? 'edit' : 'add'}_lottery`)}
          </span>
        </a>,
        1
      );
    }

    if (this.composer.fields.lottery) {
      items.add('lottery-preview', <LotteryPreview lottery={this.composer.fields.lottery} />, -10);
    }
  });

  extend(composer, 'data', function (data) {
    if (this.composer.fields.lottery) {
      data.lotteryData = this.composer.fields.lottery;
    }
  });
};

export default () => {
  addToComposer();
};
