import app from 'flarum/forum/app';

import { extend } from 'flarum/common/extend';
import Badge from 'flarum/common/components/Badge';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import Discussion from 'flarum/common/models/Discussion';

export default () => {
  extend(DiscussionPage.prototype, 'requestParams', (params) => {
    if (typeof params.include === 'string') {
      params.include = [params.include];
    }

    params.include = params.include || [];

    if (!params.include.includes('posts.lottery')) {
      params.include.push('posts.lottery');
    }
  });

  extend(DiscussionList.prototype, 'requestParams', (params) => {
    if (typeof params.include === 'string') {
      params.include = [params.include];
    }

    params.include = params.include || [];

    if (!params.include.includes('firstPost.lottery')) {
      params.include.push('firstPost.lottery');
    }
  });

  extend(Discussion.prototype, 'badges', function (badges) {
    if (this.hasLottery()) {
      badges.add(
        'lottery',
        Badge.component({
          type: 'lottery',
          label: app.translator.trans('nodeloc-lottery.forum.tooltip.badge'),
          icon: 'fas fa-gift',
        }),
        5
      );
    }
  });
};
