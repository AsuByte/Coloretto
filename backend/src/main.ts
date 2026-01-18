import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from '@/app.module';
import * as dotenv from 'dotenv';
import { Server } from 'socket.io';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  app.use(cookieParser());

  app.use(passport.initialize());

  app.useWebSocketAdapter(
    new (class extends IoAdapter {
      createIOServer(port: number, options?: any): Server {
        options = {
          cors: {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true,
          },
        };
        return super.createIOServer(port, options);
      }
    })(app),
  );

  const port = process.env.PORT || 3001;

  await app.listen(port);
}

bootstrap();

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (payload, done) => {
      const userId = payload.sub;
      done(null, { userId });
    },
  ),
);
