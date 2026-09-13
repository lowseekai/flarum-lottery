import app from 'flarum/forum/app';

import addDiscussionBadge from './addDiscussionBadge';
import addComposerItems from './addComposerItems';
import addLotteryToPost from './addLotteryToPost';
import FailLotteryNotification from './components/FailLotteryNotification';
import FinishLotteryNotification from './components/FinishLotteryNotification';
import DrawLotteryNotification from './components/DrawLotteryNotification';
import extend from './extend';

export * from './components';
export * from './models';

app.initializers.add('nodeloc/lottery', () => {
  extend.forEach((extender) => extender.extend(app));
  addDiscussionBadge();
  addComposerItems();
  addLotteryToPost();
  app.notificationComponents.drawLottery = DrawLotteryNotification;
  app.notificationComponents.failLottery = FailLotteryNotification;
  app.notificationComponents.finishLottery = FinishLotteryNotification;
});

export { extend };
