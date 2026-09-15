import prisma from '../config/prisma.js';

async function backfill() {
  console.log('[Backfill] Starting Lucy username backfill...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      leetcodeUsername: true,
      lucyUsername: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[Backfill] Found ${users.length} total users.`);

  const taken = new Set();
  let updatedCount = 0;

  for (const user of users) {
    // Keep exact leetcodeUsername if available, otherwise name or user_id fallback
    let candidate = user.leetcodeUsername?.trim();
    if (!candidate) {
      candidate = (user.name?.trim().replace(/\s+/g, '_') || `user_${user.id.slice(0, 6)}`);
    }

    // Ensure uniqueness
    if (taken.has(candidate.toLowerCase())) {
      let suffix = 1;
      let suffixed = candidate;
      while (taken.has(suffixed.toLowerCase())) {
        suffixed = `${candidate}_${suffix}`;
        suffix++;
      }
      candidate = suffixed;
    }

    taken.add(candidate.toLowerCase());

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: { lucyUsername: candidate },
    });

    console.log(`[Backfill] Updated user ${user.name} (${user.id}) -> @${candidate} (leetcode: ${user.leetcodeUsername})`);
    updatedCount++;
  }

  console.log(`[Backfill] Successfully backfilled ${updatedCount} users!`);

  // Verification
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, leetcodeUsername: true, lucyUsername: true },
  });
  console.log('\n[Backfill] Current Users in DB:');
  for (const u of allUsers) {
    console.log(`- ${u.name}: lucyUsername="${u.lucyUsername}" | leetcode="${u.leetcodeUsername}"`);
  }

  await prisma.$disconnect();
}

backfill().catch((err) => {
  console.error('[Backfill] Failed:', err);
  process.exit(1);
});
