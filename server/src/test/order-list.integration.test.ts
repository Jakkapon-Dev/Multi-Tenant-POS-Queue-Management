import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);

export async function runOrderListIntegrationTest() {
  const directory = await mkdtemp(join(tmpdir(), 'omnipos-test-'));
  const databasePath = join(directory, 'test.db');
  process.env.DATABASE_URL = `file:${databasePath.replaceAll('\\', '/')}`;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'integration-test-secret';

  try {
    const schemaSql = execFileSync(process.execPath, [
      join(dirname(require.resolve('prisma/package.json')), 'build/index.js'),
      'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script',
    ], { encoding: 'utf8' });
    const database = new DatabaseSync(databasePath);
    try {
      database.exec(schemaSql);
    } finally {
      database.close();
    }

    const { default: prisma } = await import('../config/prisma.js');
    const { server, io } = await import('../index.js');

    try {
      const password = 'demo-test-password';
      const staff = await prisma.user.create({
        data: {
          name: 'Store A staff',
          email: 'staff@example.test',
          passwordHash: await bcrypt.hash(password, 4),
          tenant: { create: { name: 'Store A', slug: 'store-a' } },
        },
      });
      const storeB = await prisma.tenant.create({
        data: { name: 'Store B', slug: 'store-b' },
      });
      const ownOrder = await prisma.order.create({
        data: { orderNumber: '#001', tenantId: staff.tenantId },
      });
      await prisma.order.create({
        data: { orderNumber: '#002', tenantId: storeB.id },
      });

      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert(address && typeof address !== 'string');
      const origin = `http://127.0.0.1:${address.port}`;

      const login = await fetch(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staff.email, password }),
      });
      assert.equal(login.status, 200);
      const { token } = await login.json() as { token: string };
      assert.ok(token);
      const headers = { Authorization: `Bearer ${token}` };

      for (const suffix of ['', '/kds']) {
        const ownUrl = `${origin}/api/orders/tenant/${staff.tenantId}${suffix}`;
        const own = await fetch(ownUrl, { headers });
        assert.equal(own.status, 200);
        const orders = await own.json() as { id: string }[];
        assert.deepEqual(orders.map(({ id }) => id), [ownOrder.id]);

        const forbidden = await fetch(`${origin}/api/orders/tenant/${storeB.id}${suffix}`, { headers });
        assert.equal(forbidden.status, 403);

        const anonymous = await fetch(ownUrl);
        assert.equal(anonymous.status, 401);
      }
      console.log('✓ Order list and KDS enforce tenant access through HTTP and SQLite');
    } finally {
      await io.close();
      await prisma.$disconnect();
    }
  } finally {
    await rm(directory, { recursive: true, force: true, maxRetries: 5 });
  }
}
