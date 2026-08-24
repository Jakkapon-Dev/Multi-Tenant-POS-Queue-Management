export function runOrderStateMachineTests() {
  console.log('🧪 Running Suite: Order State Machine & Financial Calculations...');

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  // Test 1: Subtotal & Tax Calculation
  const items = [
    { name: 'Iced Velvet Latte', price: 110, quantity: 2 }, // 220
    { name: 'Butter Croissant', price: 95, quantity: 1 },    // 95
  ];
  const taxRate = 7.0; // 7%
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  assert(subtotal === 315, 'Subtotal should equal sum of items (315)');

  const tax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  assert(tax === 22.05, 'Tax at 7% should equal 22.05');

  const discount = 15; // 15 baht discount
  const grandTotal = Math.round((subtotal + tax - discount) * 100) / 100;
  assert(grandTotal === 322.05, 'Grand total should be 322.05');

  // Test 2: State Machine Valid Transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SERVED', 'COMPLETED'],
    SERVED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  function canTransition(current: string, next: string): boolean {
    return validTransitions[current]?.includes(next) ?? false;
  }

  assert(canTransition('PENDING', 'PREPARING') === true, 'PENDING can transition to PREPARING');
  assert(canTransition('PREPARING', 'READY') === true, 'PREPARING can transition to READY');
  assert(canTransition('READY', 'SERVED') === true, 'READY can transition to SERVED');
  assert(canTransition('COMPLETED', 'PENDING') === false, 'COMPLETED cannot transition back to PENDING');

  console.log(`✨ Order State Machine: ${testsPassed}/${testsTotal} passed\n`);
  return { testsPassed, testsTotal };
}
