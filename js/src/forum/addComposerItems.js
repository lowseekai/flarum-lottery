import app from 'flarum/forum/app';

import { extend } from 'flarum/common/extend';
import TextEditor from 'flarum/common/components/TextEditor';
import classList from 'flarum/common/utils/classList';

import CreateLotteryModal from './components/CreateLotteryModal';
import LotteryPreview from './components/LotteryPreview';

const discussionComposer = 'flarum/forum/components/DiscussionComposer';

function showLotteryModal(attrs) {
  app.modal.show(CreateLotteryModal, attrs);

  // Flarum 2 mounts modals inside requestAnimationFrame. If the frame is
  // delayed, keep the composer interaction responsive by applying the same
  // modal state synchronously as a fallback.
  setTimeout(() => {
    if (app.modal.isModalOpen()) {
      return;
    }

    app.modal.backdropShown = true;
    app.modal.modal = { componentClass: CreateLotteryModal, attrs, key: app.modal.key++ };
    app.modal.modalList = [app.modal.modal];
    m.redraw.sync();
  }, 50);
}

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
          onclick={() => {
            showLotteryModal({
              lottery: this.composer.fields.lottery,
              onsubmit: (lottery) => {
                this.composer.fields.lottery = lottery;
                m.redraw();
              },
            });
          }}
        >
          <span className={classList('LotteryLabel', !this.composer.fields.lottery && 'none')}>
            {app.translator.trans(`nodeloc-lottery.forum.composer_discussion.${this.composer.fields.lottery ? 'edit' : 'add'}_lottery`)}
          </span>
        </a>,
        1
      );
    }
  });

  extend(composer, 'data', function (data) {
    if (this.composer.fields.lottery) {
      data.lotteryData = this.composer.fields.lottery;
    }
  });
};

function syncLotteryPreview(textEditor) {
  const composer = textEditor.attrs.composer;
  const mentionsWrapper = textEditor.$('.ComposerBody-mentionsWrapper')[0];
  const composerElement = textEditor.element?.closest('.Composer');

  if (!composer || !mentionsWrapper) {
    return;
  }

  let mount = mentionsWrapper.querySelector('.LotteryPreview-composerMount');

  if (!composer.fields.lottery) {
    composerElement?.classList.remove('has-lottery-preview');

    if (mount) {
      m.render(mount, null);
      mount.remove();
    }

    return;
  }

  composerElement?.classList.add('has-lottery-preview');

  if (!mount) {
    mount = document.createElement('div');
    mount.className = 'LotteryPreview-composerMount';
    const editorWrapper = mentionsWrapper.querySelector('.ComposerBody-emojiWrapper');

    if (editorWrapper) {
      mentionsWrapper.insertBefore(mount, editorWrapper);
    } else {
      mentionsWrapper.appendChild(mount);
    }
  }

  m.render(mount, <LotteryPreview lottery={composer.fields.lottery} />);
}

export const addComposerLotteryPreview = () => {
  extend(TextEditor.prototype, 'oncreate', function () {
    if (this.attrs.composer) {
      syncLotteryPreview(this);
    }
  });

  extend(TextEditor.prototype, 'onupdate', function () {
    if (this.attrs.composer) {
      syncLotteryPreview(this);
    }
  });

  extend(TextEditor.prototype, 'onremove', function () {
    const mount = this.$('.LotteryPreview-composerMount')[0];
    const composerElement = this.element?.closest('.Composer');

    composerElement?.classList.remove('has-lottery-preview');

    if (mount) {
      m.render(mount, null);
    }
  });
};

export default () => {
  addToComposer();
  addComposerLotteryPreview();
};
