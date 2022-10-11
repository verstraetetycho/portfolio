# Portfolio

There is an API for managing the projects, the blog posts, my skills, etc.
Attached to that is a frontend with the information of my portfolio and numerous forms to manage the data (interacting with the API).

This project is a project to excel at all my skills. It has to be as performant and secure as possible confined in the js stack (as I am a js developer). And it has to be a nice user experience whilst being unique.

<br>

## API

The API is written in Fastify to maximize the performance and control.

## Frontend

The frontend is written in Solid. This is also for performance but Solid comes with a great developer experience as well.

## Performance

The project is centered around the performance to make sure this is one of the fastest technology combos (in js) around.

In addition to that there is a Redis server in between to cache the api responses and thus get quicker API responses.

Solid is used to have a performant frontend that isn't using a virtual DOM. Because of this the pages will load faster.

## Security

The site will be secure in both backend, frontend and networking aspects to make sure I'm protected to attacks like Cross-site Scripting, HTTP Parameter Pollution attacks, JSON pollution, DDOS. I'm also sanitizing user data, and making use of CORS, Man in the middle, etc.

More on the security in Security.md

## Permissions & Rights

The web application will make sure to be accordingly the latest GDPR standards.

<br>

## Run for development

### Backend

Navigate to the api folder

```bash
cd api
```

Run the docker backend by running

```bash
pnpm run docker-dev
```

### Frontend

Navigate to the web folder

```bash
cd web
```

Run the development script

```bash
npm run dev
```
