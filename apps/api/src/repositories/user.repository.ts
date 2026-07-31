// export class UserRepository {
//   findById() {
//     throw new Error("TODO: implement user repository in your branch");
//   }
// }

import { User, IUser } from "../models/user.model";

export class UserRepository {
  findById(id: string) {
    return User.findById(id);
  }

  // withPasswordHash re-selects the normally-hidden passwordHash field —
  // used only by login, which needs it to compare against bcrypt.
  findByEmail(email: string, withPasswordHash = false) {
    const query = User.findOne({ email });
    return withPasswordHash ? query.select("+passwordHash") : query;
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<IUser> {
    return User.create(data);
  }
}