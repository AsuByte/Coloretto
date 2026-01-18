"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const dotenv_1 = require("dotenv");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./users/auth/auth.module");
const upload_service_1 = require("./users/upload.service");
const chat_gateway_1 = require("./chats/chat.gateway");
const message_module_1 = require("./messages/message.module");
const game_module_1 = require("./games/game.module");
(0, dotenv_1.config)();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            message_module_1.MessageModule,
            game_module_1.GameModule,
        ],
        providers: [chat_gateway_1.ChatGateway, upload_service_1.UploadService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map