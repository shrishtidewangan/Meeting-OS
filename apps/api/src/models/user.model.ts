// export type UserModelStub = {
//   id: string;
//   email: string;
//   passwordHash: string;
// };

// TODO: replace with a Mongoose schema in your branch.

import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = model<IUser>("User", userSchema);