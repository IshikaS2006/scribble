// Test Step 8: MongoDB Persistence
const { io } = require("socket.io-client");

async function testStep8() {
  console.log("🧪 Testing Step 8: MongoDB Persistence\n");

  // Step 1: Create room and draw
  console.log("📝 Step 1: Creating room and drawing...");
  const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
  const { roomId, adminKey } = await response.json();
  console.log(`✅ Room: ${roomId}\n`);

  const adminSocket = io("http://localhost:3001");

  await new Promise((resolve) => {
    adminSocket.on("connect", () => {
      console.log("👑 Admin connected:", adminSocket.id);
      adminSocket.emit("joinRoom", { roomId, userId: "Admin", adminKey });
      
      adminSocket.on("join-ack", () => {
        console.log("✅ Admin joined room");
        
        // Draw 2 strokes
        setTimeout(() => {
          console.log("🎨 Drawing stroke 1...");
          adminSocket.emit("public-stroke", {
            id: "persist-stroke-1",
            points: [[10, 10], [100, 100]],
            color: "#FF0000",
            width: 3
          });
        }, 500);

        setTimeout(() => {
          console.log("🎨 Drawing stroke 2...");
          adminSocket.emit("public-stroke", {
            id: "persist-stroke-2",
            points: [[50, 50], [150, 150]],
            color: "#00FF00",
            width: 3
          });
        }, 1000);

        setTimeout(() => {
          console.log("✅ Strokes drawn, disconnecting...\n");
          adminSocket.disconnect();
          resolve();
        }, 2000);
      });
    });
  });

  // Step 2: Wait a bit (simulating page refresh / browser close)
  console.log("⏳ Step 2: Waiting 3 seconds (simulating refresh)...\n");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Rejoin and check if strokes persist
  console.log("📥 Step 3: Rejoining room to check persistence...");
  const newSocket = io("http://localhost:3001");

  await new Promise((resolve) => {
    newSocket.on("connect", () => {
      console.log("👤 New user connected:", newSocket.id);
      newSocket.emit("joinRoom", { roomId, userId: "NewUser", adminKey: "" });
      
      newSocket.on("room-joined", (data) => {
        console.log(`\n📊 Room joined! Public strokes: ${data.publicStrokes.length}`);
        
        if (data.publicStrokes.length === 2) {
          console.log("✅ Stroke 1:", data.publicStrokes[0].id);
          console.log("✅ Stroke 2:", data.publicStrokes[1].id);
          console.log("\n🎉 SUCCESS! Drawings survived refresh!");
          console.log("   ✓ MongoDB persistence working");
          console.log("   ✓ Strokes loaded from database\n");
        } else {
          console.log(`\n❌ FAIL: Expected 2 strokes, got ${data.publicStrokes.length}\n`);
        }
        
        newSocket.disconnect();
        resolve();
        process.exit(0);
      });
    });
  });
}

testStep8().catch(console.error);
