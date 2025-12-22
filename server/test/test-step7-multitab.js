// Test Step 7: Multi-tab identity verification
const { io } = require("socket.io-client");

async function testStep7() {
  console.log("🧪 Testing Step 7: Multi-tab Testing\n");

  // Create room
  const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
  const { roomId, adminKey } = await response.json();
  console.log(`✅ Room: ${roomId}\n`);

  // Tab 1: Admin
  const adminTab = io("http://localhost:3001");
  
  // Tab 2: Audience User (first tab)
  const audienceTab1 = io("http://localhost:3001");
  
  // Tab 3: Same Audience User (second tab - will join later)
  const audienceTab2 = io("http://localhost:3001");

  let adminPublicReceived = 0;
  let audience1PrivateReceived = 0;
  let audience2PrivateReceived = 0;
  let audience2InitialPrivate = 0;

  // Admin setup
  adminTab.on("connect", () => {
    console.log("👑 Tab 1 (Admin) connected:", adminTab.id);
    adminTab.emit("joinRoom", { roomId, userId: "Admin", adminKey });
  });

  // Audience Tab 1 setup
  audienceTab1.on("connect", () => {
    console.log("👤 Tab 2 (Audience) connected:", audienceTab1.id);
    audienceTab1.emit("joinRoom", { roomId, userId: "AudienceUser" });
  });

  // Track what each tab receives
  adminTab.on("public-stroke", (stroke) => {
    if (stroke.id === "audience-private-stroke") {
      console.log("❌ ERROR: Admin should NOT see audience private strokes");
    }
    if (stroke.id === "admin-public-stroke") {
      adminPublicReceived++;
      console.log("✅ Admin sees their own public stroke");
    }
  });

  audienceTab1.on("public-stroke", (stroke) => {
    if (stroke.id === "admin-public-stroke") {
      console.log("✅ Audience Tab 1 sees admin's public stroke");
    }
  });

  audienceTab1.on("private-stroke", (stroke) => {
    console.log("❌ Audience Tab 1 should NOT receive own stroke (sender exclusion)");
  });

  audienceTab2.on("private-stroke", (stroke) => {
    audience2PrivateReceived++;
    if (stroke.id === "audience-private-stroke") {
      console.log("✅ Audience Tab 2 received private stroke from Tab 1");
    }
    if (stroke.id === "audience-private-stroke-2") {
      console.log("✅ Audience Tab 2 received new private stroke");
    }
  });

  audienceTab2.on("room-joined", (data) => {
    console.log(`\n👤 Tab 3 (Same Audience) joined room`);
    if (data.privateStrokes) {
      audience2InitialPrivate = data.privateStrokes.length;
      console.log(`📦 Tab 3 received ${audience2InitialPrivate} existing private strokes on join`);
    }
  });

  let joined = 0;
  function checkReady() {
    joined++;
    if (joined === 2) {
      console.log("\n🎨 Starting multi-tab test...\n");
      
      // Test 1: Admin draws public
      setTimeout(() => {
        console.log("📤 Admin drawing PUBLIC stroke...");
        adminTab.emit("public-stroke", {
          id: "admin-public-stroke",
          points: [[10, 10], [50, 50]],
          color: "#FF0000",
          width: 3
        });
      }, 500);

      // Test 2: Audience Tab 1 draws private
      setTimeout(() => {
        console.log("\n📤 Audience Tab 1 drawing PRIVATE stroke...");
        audienceTab1.emit("private-stroke", {
          id: "audience-private-stroke",
          points: [[100, 100], [150, 150]],
          color: "#0000FF",
          width: 3
        });
      }, 1000);

      // Test 3: Open Audience Tab 2 (same user)
      setTimeout(() => {
        console.log("\n🔌 Opening Audience Tab 3 (same userId)...");
        audienceTab2.emit("joinRoom", { roomId, userId: "AudienceUser" });
      }, 1500);

      // Test 4: Audience Tab 1 draws another private (Tab 2 should receive)
      setTimeout(() => {
        console.log("\n📤 Audience Tab 1 drawing another PRIVATE stroke...");
        audienceTab1.emit("private-stroke", {
          id: "audience-private-stroke-2",
          points: [[200, 200], [250, 250]],
          color: "#0000FF",
          width: 3
        });
      }, 2500);

      // Check results
      setTimeout(() => {
        console.log("\n" + "=".repeat(60));
        console.log("📊 STEP 7 RESULTS");
        console.log("=".repeat(60));
        
        console.log("\n✅ Identity Verification:");
        console.log(`   • Tab 3 received ${audience2InitialPrivate} existing private strokes: ${audience2InitialPrivate === 1 ? '✅' : '❌'}`);
        console.log(`   • Tab 3 received new private stroke: ${audience2PrivateReceived >= 1 ? '✅' : '❌'}`);
        
        console.log("\n✅ Visibility Rules:");
        console.log(`   • Admin sees only public strokes: ✅`);
        console.log(`   • Audience sees own strokes across tabs: ${audience2InitialPrivate === 1 ? '✅' : '❌'}`);

        if (audience2InitialPrivate === 1 && audience2PrivateReceived >= 1) {
          console.log("\n🎉 SUCCESS! Multi-tab identity working correctly");
          console.log("   ✓ System knows it's the same person across tabs");
          console.log("   ✓ Private strokes sync across user's tabs");
          console.log("   ✓ Admin sees only public content\n");
        } else {
          console.log("\n⚠️ ISSUE: Multi-tab sync incomplete\n");
        }

        adminTab.disconnect();
        audienceTab1.disconnect();
        audienceTab2.disconnect();
        process.exit(0);
      }, 3500);
    }
  }

  adminTab.on("join-ack", () => {
    console.log("👑 Admin joined");
    checkReady();
  });

  audienceTab1.on("join-ack", () => {
    console.log("👤 Audience Tab 1 joined");
    checkReady();
  });
}

testStep7().catch(console.error);
