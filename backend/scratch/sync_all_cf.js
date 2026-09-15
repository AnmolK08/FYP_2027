import { config } from 'dotenv';
config();

import { connectRedis } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { syncCodeforcesStats } from '../services/codeforces.service.js';

async function main() {
  await connectRedis();

  const users = await prisma.user.findMany({
    where: {
      codeforcesUsername: {
        not: null
      }
    }
  });

  console.log(`Found ${users.length} users with Codeforces connected.`);

  for (const user of users) {
    try {
      console.log(`Syncing user ${user.id} (${user.codeforcesUsername})...`);
      await syncCodeforcesStats(user.id);
      console.log(`Successfully synced user ${user.id}`);
      // Sleep a bit to avoid rate limits from Codeforces API
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`Failed to sync user ${user.id}:`, err.message);
    }
  }

  process.exit(0);
}

main();
