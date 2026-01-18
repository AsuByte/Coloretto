import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CardDocument = Card & Document;

@Schema()
export class Card {

  @Prop({ required: true })
  color: string;

  @Prop({ default: false })
  isEndRound: boolean;
  
  @Prop({ default: false })
  isCompensation?: boolean;
}

export const CardSchema = SchemaFactory.createForClass(Card);

export type ColumnDocument = Column & Document;

@Schema()
export class Column {
  @Prop({ type: [CardSchema], default: [] })
  cards: Card[];
}

export const ColumnSchema = SchemaFactory.createForClass(Column);

const schemaOptions = {
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
};

CardSchema.set('toJSON', schemaOptions.toJSON);
ColumnSchema.set('toJSON', schemaOptions.toJSON);
