const { io } = require("socket.io-client");

// TEST: Admin user joining with adminKey
// These are default hardcoded values - run setup-room.js to create a fresh room
const TEST_ROOM_ID = "10f85d36-e378-4241-8b85-72cddcd555fe";
const TEST_ADMIN_KEY = "cf876ebfc9e35fd89166b9bceac80980";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("🔌 Connected:", socket.id);

  socket.emit("joinRoom", {
    roomId: TEST_ROOM_ID,
    userId: "adminUser",
    adminKey: TEST_ADMIN_KEY
  });
});

socket.on("join-ack", (data) => {
  console.log("✅ JOIN ACK:", data);
  if (data.isAdmin) {
    console.log("👑 Successfully joined as ADMIN!");
  } else {
    console.log("❌ Not an admin (check if room exists or key is correct)");
  }
  // ⭐ PRIVATE STROKE TEST STARTS HERE
  setTimeout(() => {
    console.log("📤 Sending private stroke...");
    const strokeData = {
      id: "stroke-" + Date.now(),
      points: [{ x: 100, y: 200 }, { x: 150, y: 250 }],
      color: "#FF0000",
      width: 5
    };
    console.log("📤 Stroke payload:", strokeData);
    socket.emit("private-stroke", strokeData);
    console.log("✅ Sent!");
  }, 2000);

  // ⭐ PUBLIC STROKE TEST STARTS HERE
  setTimeout(() => {
    console.log("📤 Sending public stroke...");
    const publicStrokeData = {
      id: "public-stroke-" + Date.now(),
      points: [{ x: 300, y: 150 }, { x: 350, y: 200 }],
      color: "#00FF00",
      width: 3
    };
    console.log("📤 Public stroke payload:", publicStrokeData);
    socket.emit("public-stroke", publicStrokeData);
    console.log("✅ Public stroke sent!");
  }, 4000); // send after 4s so private test finishes

});

socket.on("room-joined", (data) => {
  console.log("📋 Room joined:", {
    userCount: data.userCount,
    publicStrokes: data.publicStrokes.length
  });
});


socket.on("private-stroke", (data) => {
  console.log("🔒 PRIVATE STROKE RECEIVED:", data);
});

socket.on("public-stroke", (data) => {
  console.log("🎨 PUBLIC STROKE RECEIVED (Admin Tab):", data);
});

socket.on("error", (err) => {
  console.log("❌ Error:", err);
});

socket.on("users-update", (data) => {
  console.log("👥 Users update:", data.count);
});
