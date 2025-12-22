const { io } = require("socket.io-client");

// TEST: Simulates another tab of the SAME admin user (multi-tab test)
// To receive private strokes, must use SAME userId as test-client.js
const TEST_ROOM_ID = "10f85d36-e378-4241-8b85-72cddcd555fe";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("🔌 Connected (Tab 2):", socket.id);

  socket.emit("joinRoom", {
    roomId: TEST_ROOM_ID,
    userId: "adminUser"  // ⭐ SAME userId as test-client for multi-tab test
    // NO adminKey - testing multi-tab for same user
  });
});
socket.on("join-ack", (data) => {
  console.log("JOIN ACK:", data);

  
});

socket.on("private-stroke", (data) => {
  console.log("🔒 PRIVATE STROKE RECEIVED (User Tab):", data);
});

socket.on("public-stroke", (data) => {
  console.log("🎨 PUBLIC STROKE RECEIVED (User Tab):", data);
});

socket.on("error", (err) => {
  console.log("❌ Error:", err);
});

socket.on("room-joined", (data) => {
  console.log("📋 Room joined:", {
    userCount: data.userCount,
    publicStrokes: data.publicStrokes.length
  });
});

socket.on("users-update", (data) => {
  console.log("👥 Users update:", data.count);
});
