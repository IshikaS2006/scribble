// Automatically creates a room and updates test files
// Run this to create a fresh test room

const fs = require('fs');
const path = require('path');

async function setupTestRoom() {
  console.log('🔄 Creating new test room...\n');
  
  const response = await fetch('http://localhost:3001/rooms', {
    method: 'POST'
  });
  const { roomId, adminKey } = await response.json();
  
  console.log('✅ Room created!');
  console.log('='.repeat(50));
  console.log(`Room ID:   ${roomId}`);
  console.log(`Admin Key: ${adminKey}`);
  console.log('='.repeat(50));
  
  // Update test-client.js
  const clientPath = path.join(__dirname, 'test-client.js');
  let clientCode = fs.readFileSync(clientPath, 'utf8');
  clientCode = clientCode.replace(
    /const TEST_ROOM_ID = "[^"]*";/,
    `const TEST_ROOM_ID = "${roomId}";`
  );
  clientCode = clientCode.replace(
    /const TEST_ADMIN_KEY = "[^"]*";/,
    `const TEST_ADMIN_KEY = "${adminKey}";`
  );
  fs.writeFileSync(clientPath, clientCode);
  
  // Update test-user.js
  const userPath = path.join(__dirname, 'test-user.js');
  let userCode = fs.readFileSync(userPath, 'utf8');
  userCode = userCode.replace(
    /const TEST_ROOM_ID = "[^"]*";/,
    `const TEST_ROOM_ID = "${roomId}";`
  );
  fs.writeFileSync(userPath, userCode);
  
  console.log('\n✏️  Updated test-client.js and test-user.js');
  console.log('🚀 Ready! Run: node test-client.js (admin) / node test-user.js (user)');
}

setupTestRoom().catch(console.error);
