import { runOrderListIntegrationTest } from './order-list.integration.test.js';
import { runOrderStateMachineTests } from './order-state-machine.test.js';
import { runTenantIsolationTests } from './tenant-isolation.test.js';

async function main() {
  console.log('====================================================');
  console.log('🚀 OmniPOS Automated Test Suite (v0.2.0 QA Runner)');
  console.log('====================================================\n');

  const t1 = runOrderStateMachineTests();
  const t2 = runTenantIsolationTests();

  await runOrderListIntegrationTest();

  const totalPassed = t1.testsPassed + t2.testsPassed + 1;
  const totalTests = t1.testsTotal + t2.testsTotal + 1;

  console.log('====================================================');
  console.log(`🎉 ALL TESTS PASSED! (${totalPassed}/${totalTests} tests successful)`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
