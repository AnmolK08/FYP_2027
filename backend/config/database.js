import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Neon adapter requires a WebSocket implementation in Node.js
if (!global.WebSocket) {
  global.WebSocket = ws;
}

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
