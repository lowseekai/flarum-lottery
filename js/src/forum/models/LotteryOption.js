import Model from 'flarum/common/Model';

export default class LotteryOption extends Model {
  operatorType = Model.attribute('operatorType');
  operator = Model.attribute('operator');
  operatorValue = Model.attribute('operatorValue');

  lottery = Model.hasOne('lottery');

  apiEndpoint() {
    return `/lottery-options${this.exists ? `/${this.data.id}` : ''}`;
  }
}
