import { Document } from 'mongoose';
export type CardDocument = Card & Document;
export declare class Card {
    color: string;
    isEndRound: boolean;
    isCompensation?: boolean;
}
export declare const CardSchema: import("mongoose").Schema<Card, import("mongoose").Model<Card, any, any, any, Document<unknown, any, Card, any, {}> & Card & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Card, Document<unknown, {}, import("mongoose").FlatRecord<Card>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Card> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type ColumnDocument = Column & Document;
export declare class Column {
    cards: Card[];
}
export declare const ColumnSchema: import("mongoose").Schema<Column, import("mongoose").Model<Column, any, any, any, Document<unknown, any, Column, any, {}> & Column & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Column, Document<unknown, {}, import("mongoose").FlatRecord<Column>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Column> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
