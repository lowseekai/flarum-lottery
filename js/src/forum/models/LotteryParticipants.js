import Model from 'flarum/common/Model';

export default class LotteryParticipants extends Model {
  lottery = Model.hasOne('lottery');
  user = Model.hasOne('user');
  status = Model.attribute('status');
  lotteryId = Model.attribute('lotteryId');

  apiEndpoint() {
    return `/lottery-participants${this.exists ? `/${this.data.id}` : ''}`;
  }
}
