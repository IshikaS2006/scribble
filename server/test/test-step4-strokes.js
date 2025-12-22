// Test Step 4: Verify stroke listeners work
const { io } = require("socket.io-client");

async function testStep4() {
  console.log("🧪 Testing Step 4: Stroke Listeners\n");

  // Create room
  console.log("📝 Creating test room...");
  const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
  const { roomId, adminKey } = await response.json();
  console.log(`✅ Room: ${roomId}\n`);

  // User 1: Admin (will send strokes)
  const admin = io("http://localhost:3001");
  
  // User 2: Regular user (will receive strokes)
  const user = io("http://localhost:3001");

  let receivedPublic = 0;
  let receivedPrivate = 0;

  admin.on("connect", () => {
    console.log("👑 Admin connected:", admin.id);
    admin.emit("joinRoom", { roomId, userId: "Admin", adminKey });
  });

  user.on("connect", () => {
    console.log("👤 User connected:", user.id);
    user.emit("joinRoom", { roomId, userId: "User", adminKey: "" });
  });

  // User listens for strokes
  user.on("room-joined", (data) => {
    console.log(`\n📋 User joined. Public strokes on join: ${data.publicStrokes.length}`);
    
    // After user joins, admin sends strokes
    setTimeout(() => {
      console.log("\n🎨 Admin sending PUBLIC stroke...");
      admin.emit("public-stroke", {
        id: "stroke-1",
        points: [[10, 10], [20, 20]],
        color: "#FF0000",
        width: 2
      });
    }, 500);

    setTimeout(() => {
      console.log("✏️ User sending PRIVATE stroke...");
      user.emit("private-stroke", {
        id: "stroke-2",
        points: [[30, 30], [40, 40]],
        color: "#0000FF",
        width: 2
      });
    }, 1000);
  });

  user.on("public-stroke", (stroke) => {
    receivedPublic++;
    console.log(`✅ User received PUBLIC stroke: ${stroke.id} from ${stroke.from}`);
  });

  user.on("private-stroke", (stroke) => {
    receivedPrivate++;
    console.log(`❌ User should NOT receive own private stroke: ${stroke.id}`);
  });

  admin.on("private-stroke", (stroke) => {
    receivedPrivate++;
    console.log(`❌ Admin should NOT receive private stroke (different user)`);
  });

  // Check results after 2 seconds
  setTimeout(() => {
    console.log("\n📊 Results:");
    console.log(`   Public strokes received by user: ${receivedPublic}`);
    console.log(`   Private strokes incorrectly received: ${receivedPrivate}`);
    
    if (receivedPublic === 1 && receivedPrivate === 0) {
      console.log("\n🎉 SUCCESS! All stroke listeners working correctly");
      console.log("   ✓ Public stroke broadcasted to all users");
      console.log("   ✓ Private stroke NOT sent to sender (correct behavior)\n");
    } else {
      console.log("\n⚠️ ISSUE: Expected 1 public stroke and 0 private (sender shouldn't receive own)\n");
    }
    
    admin.disconnect();
    user.disconnect();
    process.exit(0);
  }, 2000);
}

testStep4().catch(console.error);
