"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColumnSchema = exports.Column = exports.CardSchema = exports.Card = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Card = class Card {
};
exports.Card = Card;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Card.prototype, "color", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Card.prototype, "isEndRound", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Card.prototype, "isCompensation", void 0);
exports.Card = Card = __decorate([
    (0, mongoose_1.Schema)()
], Card);
exports.CardSchema = mongoose_1.SchemaFactory.createForClass(Card);
let Column = class Column {
};
exports.Column = Column;
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CardSchema], default: [] }),
    __metadata("design:type", Array)
], Column.prototype, "cards", void 0);
exports.Column = Column = __decorate([
    (0, mongoose_1.Schema)()
], Column);
exports.ColumnSchema = mongoose_1.SchemaFactory.createForClass(Column);
const schemaOptions = {
    toJSON: {
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        },
    },
};
exports.CardSchema.set('toJSON', schemaOptions.toJSON);
exports.ColumnSchema.set('toJSON', schemaOptions.toJSON);
//# sourceMappingURL=card.schema.js.map