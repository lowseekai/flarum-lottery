import Model from 'flarum/common/Model';

export default class Lottery extends Model {
  prizes = Model.attribute('prizes');
  hasEnded = Model.attribute('hasEnded');
  endDate = Model.attribute('endDate');

  price = Model.attribute('price');
  amount = Model.attribute('amount');
  minParticipants = Model.attribute('minParticipants');
  maxParticipants = Model.attribute('maxParticipants');

  enterCount = Model.attribute('enterCount');
  status = Model.attribute('status');
  canEnter = Model.attribute('canEnter');
  canEdit = Model.attribute('canEdit');
  canDelete = Model.attribute('canDelete');
  allowCancelEnter = Model.attribute('allowCancelEnter');
  canSeeParticipants = Model.attribute('canSeeParticipants');
  canCancelEnter = Model.attribute('canCancelEnter');

  options = Model.hasMany('options');
  participants = Model.hasMany('participants');
  lotteryParticipants = Model.hasMany('lotteryParticipants');

  apiEndpoint() {
    return `/lotteries${this.exists ? `/${this.data.id}` : ''}`;
  }
}
