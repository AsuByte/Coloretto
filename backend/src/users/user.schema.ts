import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
  _id?: string;

  @Prop({ required: true, maxlength: 100 })
  fullname: string;

  @Prop({ required: true, unique: true, maxlength: 25 })
  username: string;

  @Prop({ required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  profilePicture: string;

  @Prop({ type: Number, default: 0 })
  gamesPlayed: number;

  @Prop({ type: Number, default: 0 })
  gamesWon: number;

  @Prop({ type: Number, default: 0 })
  gamesLost: number;

  @Prop({ default: null })
  lastSeen: Date;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  connectionStartTime: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
