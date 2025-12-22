// Test Step 6: Verify stroke emission and reception
const { io } = require("socket.io-client");

async function testStep6() {
  console.log(" Testing Step 6: Emit Strokes on PointerUp\n");

  const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
  const { roomId, adminKey } = await response.json();
  console.log(` Room: ${roomId}\n`);

  const admin = io("http://localhost:3001");
  const audience = io("http://localhost:3001");

  let adminPublicReceived = false;
  let audiencePublicReceived = false;

  admin.on("connect", () => {
    console.log(" Admin connected:", admin.id);
    admin.emit("joinRoom", { roomId, userId: "Admin", adminKey });
  });

  audience.on("connect", () => {
    console.log(" Audience connected:", audience.id);
    audience.emit("joinRoom", { roomId, userId: "Audience" });
  });

  admin.on("public-stroke", (stroke) => {
    if (stroke.id === "admin-public-stroke") {
      adminPublicReceived = true;
      console.log(" Admin received their PUBLIC stroke back");
    }
  });

  audience.on("public-stroke", (stroke) => {
    if (stroke.id === "admin-public-stroke") {
      audiencePublicReceived = true;
      console.log(" Audience received Admin's PUBLIC stroke");
    }
  });

  let joined = 0;
  function checkReady() {
    joined++;
    if (joined === 2) {
      console.log("\n Starting tests...\n");
      
      setTimeout(() => {
        console.log(" Admin emitting PUBLIC stroke...");
        admin.emit("public-stroke", {
          id: "admin-public-stroke",
          points: [[10, 10], [50, 50]],
          color: "#FF0000",
          width: 3
        });
      }, 500);

      setTimeout(() => {
        console.log("\n Results:");
        console.log(`   Admin received back: ${adminPublicReceived ? "" : ""}`);
        console.log(`   Audience received: ${audiencePublicReceived ? "" : ""}`);

        if (adminPublicReceived && audiencePublicReceived) {
          console.log("\n SUCCESS! Admin strokes visible to everyone\n");
        }

        admin.disconnect();
        audience.disconnect();
        process.exit(0);
      }, 1500);
    }
  }

  admin.on("join-ack", checkReady);
  audience.on("join-ack", checkReady);
}

testStep6().catch(console.error);
