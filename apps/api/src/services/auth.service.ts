// export class AuthService {
//   register() {
//     throw new Error("TODO: implement registration in your branch");
//   }

//   login() {
//     throw new Error("TODO: implement login in your branch");
//   }
// }

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { getEnv } from "../config/env";

const env = getEnv();
const SALT_ROUNDS = 10;

export class AuthService {
  async register(name: string, email: string, password: string) {
    // 1. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    // 2. Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Create the user in the database
    const user = await User.create({ name, email, passwordHash });

    // 4. Issue a JWT so the user is logged in immediately after registering
    const token = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: "1d", issuer: env.JWT_ISSUER }
    );

    return { user, token };
  }

  async login(email: string, password: string) {
    // 1. Find the user, including the normally-hidden passwordHash
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Check the password against the stored hash
    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isCorrectPassword) {
      throw new Error("Invalid email or password");
    }

    // 3. Issue a JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: "1d", issuer: env.JWT_ISSUER }
    );

    return { user, token };
  }
}
