import fastify from 'fastify';
import healthCheck from 'fastify-healthcheck';
import prismaPlugin from './plugins/prisma';

const environment = process.env.NODE_ENV ?? 'development';

const envToLogger: Record<string, unknown> = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};

const app = fastify({ logger: envToLogger[environment] ?? true });

app.register(healthCheck);
app.register(prismaPlugin);

app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`App listening at ${address}`);
});
