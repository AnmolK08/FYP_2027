import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';

// Add this debug line temporarily
console.log('DATABASE_URL in prisma.js:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');

const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeon(sql);
const prisma = new PrismaClient({ adapter });

export default prisma;