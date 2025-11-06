import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'user/entities/user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo(): Function | string {
    return User;
  }

  async beforeUpdate(event: UpdateEvent<User>): Promise<any> {
    if (event.entity && event.entity.password) {
      const oldPassword = event.databaseEntity?.password;
      if (oldPassword !== event.entity.password) {
        const salt = await bcrypt.genSalt();
        event.entity.password = await bcrypt.hash(event.entity.password, salt);
      }
    }
  }
}
