import * as bcrypt from 'bcrypt';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  listenTo(): Function | string {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<any> {
    if (event.entity && event.entity.password) {
      const salt = await bcrypt.genSalt();
      event.entity.password = await bcrypt.hash(event.entity.password, salt);
    }
  }

  async beforeUpdate(event: UpdateEvent<User>): Promise<any> {
    if (event.entity && event.entity.password) {
      const oldPassword = event.databaseEntity?.password;
      if (oldPassword !== event.entity.password) {
        const salt = await bcrypt.genSalt();
        event.entity.password = await bcrypt.hash(
          event.entity.password as string,
          salt,
        );
      }
    }
  }
}
