import { chromium } from 'playwright';

(async () => {
  console.log("Starting Multi-User E2E Sync Test...");
  const browser = await chromium.launch({ headless: true });

  const BASE_URL = 'http://localhost:3000';
  const TEAM_NAME = `TestShip_${Date.now()}`;
  const PASSWORD = "testpassword123";

  // Create 3 independent contexts (like 3 separate devices)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextC = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const pageC = await contextC.newPage();

  try {
    // --- STEP 1: Registration (Player A) ---
    console.log(`[A] Registering team: ${TEAM_NAME}...`);
    await pageA.goto(`${BASE_URL}/register`);
    await pageA.fill('input[name="ship_name"]', TEAM_NAME);
    await pageA.fill('input[name="password"]', PASSWORD);
    await pageA.fill('input[name="member_1"]', "Alice");
    await pageA.fill('input[name="member_2"]', "Bob");
    await pageA.fill('input[name="member_3"]', "Charlie");
    await pageA.click('button[type="submit"]');

    // Wait for redirect to login
    await pageA.waitForURL('**/login*');
    console.log("✅ Registration successful.");

    // --- STEP 2: Simultaneous Login ---
    console.log("Logging in Alice, Bob, and Charlie simultaneously...");
    const loginPlayer = async (page, username) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', username);
      await page.fill('input[name="ship_name"]', TEAM_NAME);
      await page.fill('input[name="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/play*');
      console.log(`✅ [${username}] Logged in and arrived at /play.`);
    };

    await Promise.all([
      loginPlayer(pageA, "Alice"),
      loginPlayer(pageB, "Bob"),
      loginPlayer(pageC, "Charlie")
    ]);

    // --- STEP 3: Readiness Gate Sync ---
    console.log("Testing Readiness Gate sync...");
    // Alice clicks ready
    await pageA.click('button:has-text("I am ready")');
    console.log(`[A] Alice is ready.`);
    
    // Bob and Charlie should see Alice's status update without reloading
    await pageB.waitForSelector('li:has-text("Alice") >> text="Ready"');
    console.log(`✅ [B] Bob sees Alice is ready.`);
    await pageC.waitForSelector('li:has-text("Alice") >> text="Ready"');
    console.log(`✅ [C] Charlie sees Alice is ready.`);

    // Bob and Charlie click ready
    await pageB.click('button:has-text("I am ready")');
    await pageC.click('button:has-text("I am ready")');

    // All should now automatically advance to Trial 1 (The Lotus-Eaters)
    console.log("Waiting for all to enter Trial 1...");
    await Promise.all([
      pageA.waitForSelector('h2:has-text("Trial 1:")'),
      pageB.waitForSelector('h2:has-text("Trial 1:")'),
      pageC.waitForSelector('h2:has-text("Trial 1:")')
    ]);
    console.log("✅ All users successfully and synchronously advanced to Trial 1.");

    // --- STEP 4: Real-time Chat Sync ---
    console.log("Testing Crew Chat sync...");
    await pageA.fill('input[placeholder="Message your crew..."]', "Hello from Alice!");
    await pageA.click('button:has-text("Send")');

    await pageB.waitForSelector('div:has-text("Hello from Alice!")');
    await pageC.waitForSelector('div:has-text("Hello from Alice!")');
    console.log("✅ Chat messages synced perfectly across all clients.");

    // --- STEP 5: Puzzle Progress & Transition Sync ---
    console.log("Testing Trial 1 Puzzle solving and Transition Sync...");
    // Bob submits the correct answer for Trial 1
    console.log("[B] Bob is submitting the answer...");
    await pageB.fill('input[name="answer"]', "SHE WAITS THREE DAYS WEST");
    await pageB.click('button:has-text("Submit Answer")');

    // ALL 3 screens should automatically transition to the CompletionGate ("The Trial is Bested")
    console.log("Waiting for real-time progress sync to pull Alice and Charlie...");
    await Promise.all([
      pageA.waitForSelector('h2:has-text("The Trial is Bested")'),
      pageB.waitForSelector('h2:has-text("The Trial is Bested")'),
      pageC.waitForSelector('h2:has-text("The Trial is Bested")')
    ]);
    console.log("✅ Alice and Charlie were automatically pulled to the CompletionGate!");

    // --- STEP 6: Mark Done & Final Advance ---
    console.log("Testing Mark Done functionality...");
    await pageA.click('button:has-text("Mark My Part Done")');
    await pageB.click('button:has-text("Mark My Part Done")');
    
    // Charlie sees Alice and Bob are done
    await pageC.waitForSelector('li:has-text("Alice") >> text="Done"');
    await pageC.waitForSelector('li:has-text("Bob") >> text="Done"');
    console.log("✅ Charlie sees Alice and Bob are done.");

    await pageC.click('button:has-text("Mark My Part Done")');

    // The first one to process this state (usually all of them simultaneously) 
    // will see the "Set Sail" button or immediately auto-advance (TrialVictoryModal logic)
    console.log("Waiting for Trial Victory modal to appear...");
    await Promise.all([
      pageA.waitForSelector('button:has-text("Proceed to Next Trial")'),
      pageB.waitForSelector('button:has-text("Proceed to Next Trial")'),
      pageC.waitForSelector('button:has-text("Proceed to Next Trial")')
    ]);

    console.log("Proceeding to Trial 2...");
    await Promise.all([
      pageA.click('button:has-text("Proceed to Next Trial")'),
      pageB.click('button:has-text("Proceed to Next Trial")'),
      pageC.click('button:has-text("Proceed to Next Trial")')
    ]);

    // All should now be on Trial 2
    await Promise.all([
      pageA.waitForSelector('h2:has-text("Trial 2:")'),
      pageB.waitForSelector('h2:has-text("Trial 2:")'),
      pageC.waitForSelector('h2:has-text("Trial 2:")')
    ]);
    console.log("✅ All users successfully and synchronously advanced to Trial 2.");

    console.log("🎉 ALL MULTI-USER E2E TESTS PASSED SUCCESSFULLY! 🎉");

  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    await browser.close();
  }
})();
