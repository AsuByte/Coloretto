"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
const passport_jwt_1 = require("passport-jwt");
const passport = require("passport");
const cookieParser = require("cookie-parser");
async function bootstrap() {
    dotenv.config();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    });
    app.use(cookieParser());
    app.use(passport.initialize());
    app.useWebSocketAdapter(new (class extends platform_socket_io_1.IoAdapter {
        createIOServer(port, options) {
            options = {
                cors: {
                    origin: true,
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    credentials: true,
                },
            };
            return super.createIOServer(port, options);
        }
    })(app));
    const port = process.env.PORT || 3001;
    await app.listen(port);
}
bootstrap();
passport.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}, (payload, done) => {
    const userId = payload.sub;
    done(null, { userId });
}));
//# sourceMappingURL=main.js.map