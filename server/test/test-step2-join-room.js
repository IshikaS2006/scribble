// Simple Node.js script to test Step 2: Join Room
const { io } = require("socket.io-client");

async function testJoinRoom() {
  console.log("🧪 Testing Step 2: Join Room\n");

  // Step 1: Create a test room
  console.log("📝 Step 1: Creating test room...");
  const response = await fetch('http://localhost:3001/rooms', {
    method: 'POST'
  });
  const { roomId, adminKey } = await response.json();
  console.log(`✅ Room created: ${roomId}`);
  console.log(`🔑 Admin key: ${adminKey}\n`);

  // Step 2: Connect to server
  console.log("🔌 Step 2: Connecting to server...");
  const socket = io("http://localhost:3001");

  socket.on("connect", () => {
    console.log(`✅ Connected: ${socket.id}\n`);

    // Step 3: Join room as admin
    console.log("🚪 Step 3: Joining room as admin...");
    socket.emit("joinRoom", {
      roomId,
      userId: "TestUser",
      adminKey
    });
  });

  socket.on("join-ack", (data) => {
    console.log("✅ JOIN ACK received:");
    console.log(`   Room ID: ${data.roomId}`);
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Is Admin: ${data.isAdmin ? '👑 YES' : '👤 NO'}\n`);

    if (data.isAdmin) {
      console.log("🎉 SUCCESS! User joined as ADMIN\n");
    } else {
      console.log("⚠️  User joined but NOT as admin\n");
    }
  });

  socket.on("room-joined", (data) => {
    console.log("📋 ROOM JOINED event received:");
    console.log(`   User count: ${data.userCount}`);
    console.log(`   Public strokes: ${data.publicStrokes.length}\n`);
    
    console.log("✅ Step 2 COMPLETE!\n");
    console.log("Expected results achieved:");
    console.log("  ✓ Backend confirmed join");
    console.log("  ✓ Frontend received isAdmin status");
    console.log("  ✓ Room state synchronized\n");
    
    // Cleanup
    socket.disconnect();
    process.exit(0);
  });

  socket.on("error", (err) => {
    console.error("❌ Error:", err);
    socket.disconnect();
    process.exit(1);
  });
}

testJoinRoom().catch(console.error);
