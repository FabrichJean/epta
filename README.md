# Express + TypeScript + Prisma Boilerplate

A modern API boilerplate with Express, TypeScript, and Prisma.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update the `DATABASE_URL` in `.env` with your database credentials.

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
├── prisma/
│   └── schema.prisma    # Prisma schema
├── src/
│   └── index.ts         # Express app entry point
├── .env.example         # Example environment variables
├── .gitignore
├── nodemon.json         # Nodemon configuration
├── package.json
└── tsconfig.json        # TypeScript configuration
```

## API Endpoints

- `GET /` - Welcome message
- `GET /users` - Get all users
- `POST /users` - Create a new user
