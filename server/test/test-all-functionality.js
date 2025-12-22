const io = require('socket.io-client');

console.log('🔍 COMPREHENSIVE FUNCTIONALITY TEST\n');
console.log('Testing all features after UI restructure...\n');

let adminSocket, studentSocket;
let roomId, adminKey;
let testsPassed = 0;
let testsFailed = 0;

const tests = {
  roomCreation: false,
  adminJoin: false,
  studentJoin: false,
  adminPublicDraw: false,
  studentPrivateDraw: false,
  promoteStroke: false,
  multiTab: false,
  persistence: false
};

async function runTests() {
  console.log('📋 Test 1: Room Creation');
  try {
    const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
    const data = await response.json();
    roomId = data.roomId;
    adminKey = data.adminKey;
    console.log(`   ✅ Room created: ${roomId}`);
    console.log(`   ✅ Admin key generated: ${adminKey.substring(0, 10)}...`);
    tests.roomCreation = true;
    testsPassed++;
  } catch (e) {
    console.log(`   ❌ Room creation failed: ${e.message}`);
    testsFailed++;
    process.exit(1);
  }

  console.log('\n📋 Test 2: Admin Join with Admin Key');
  adminSocket = io('http://localhost:3001', { transports: ['websocket'] });
  
  adminSocket.on('connect', () => {
    console.log('   🔌 Admin socket connected');
    adminSocket.emit('joinRoom', { 
      roomId, 
      userId: 'teacher-bob', 
      adminKey 
    });
  });

  adminSocket.on('join-ack', (data) => {
    if (data.isAdmin) {
      console.log('   ✅ Admin joined successfully with admin privileges');
      tests.adminJoin = true;
      testsPassed++;
      
      // Test 3: Student join
      setTimeout(() => {
        console.log('\n📋 Test 3: Student Join WITHOUT Admin Key');
        studentSocket = io('http://localhost:3001', { transports: ['websocket'] });
        
        studentSocket.on('connect', () => {
          console.log('   🔌 Student socket connected');
          studentSocket.emit('joinRoom', { 
            roomId, 
            userId: 'student-alice'
            // No adminKey = regular user
          });
        });

        studentSocket.on('join-ack', (data) => {
          if (!data.isAdmin) {
            console.log('   ✅ Student joined successfully as regular user');
            tests.studentJoin = true;
            testsPassed++;
            
            // Test 4: Admin draws public stroke
            setTimeout(() => testAdminPublicDraw(), 1000);
          } else {
            console.log('   ❌ Student should not have admin privileges');
            testsFailed++;
          }
        });
      }, 1000);
    } else {
      console.log('   ❌ Admin should have admin privileges');
      testsFailed++;
    }
  });
}

function testAdminPublicDraw() {
  console.log('\n📋 Test 4: Admin Drawing (Public Strokes)');
  
  const adminStroke = {
    id: 'admin-stroke-test',
    points: [[10, 10], [20, 20], [30, 30]],
    color: '#FF0000',
    width: 3
  };

  let studentReceivedPublic = false;
  
  studentSocket.once('public-stroke', (stroke) => {
    if (stroke.id === 'admin-stroke-test') {
      studentReceivedPublic = true;
      console.log('   ✅ Student received admin\'s public stroke');
      tests.adminPublicDraw = true;
      testsPassed++;
      
      // Test 5: Student draws private stroke
      setTimeout(() => testStudentPrivateDraw(), 1000);
    }
  });

  adminSocket.emit('public-stroke', adminStroke);
  console.log('   📤 Admin sent public stroke (RED)');
}

function testStudentPrivateDraw() {
  console.log('\n📋 Test 5: Student Drawing (Private Strokes)');
  
  const studentStroke = {
    id: 'student-private-test',
    points: [[100, 100], [150, 150]],
    color: '#0000FF',
    width: 2
  };

  let adminReceivedPrivateFromOther = false;
  
  // Admin should see notification about student's private stroke
  adminSocket.once('private-stroke-from-other', (data) => {
    if (data.userId === 'student-alice' && data.stroke.id === 'student-private-test') {
      adminReceivedPrivateFromOther = true;
      console.log('   ✅ Admin notified about student\'s private stroke');
      tests.studentPrivateDraw = true;
      testsPassed++;
      
      // Test 6: Promote stroke
      setTimeout(() => testPromoteStroke(), 1000);
    }
  });

  studentSocket.emit('private-stroke', studentStroke);
  console.log('   📤 Student sent private stroke (BLUE)');
}

function testPromoteStroke() {
  console.log('\n📋 Test 6: Promote Private → Public');
  
  let studentReceivedPromoted = false;
  let adminReceivedPromoted = false;
  
  studentSocket.once('public-stroke', (stroke) => {
    if (stroke.id === 'student-private-test') {
      studentReceivedPromoted = true;
      console.log('   ✅ Student received promoted stroke as public');
      checkPromoteComplete();
    }
  });

  adminSocket.once('public-stroke', (stroke) => {
    if (stroke.id === 'student-private-test') {
      adminReceivedPromoted = true;
      console.log('   ✅ Admin received promoted stroke as public');
      checkPromoteComplete();
    }
  });

  function checkPromoteComplete() {
    if (studentReceivedPromoted && adminReceivedPromoted) {
      tests.promoteStroke = true;
      testsPassed++;
      
      // Test 7: Multi-tab
      setTimeout(() => testMultiTab(), 1000);
    }
  }

  adminSocket.emit('promote-stroke', { strokeIds: ['student-private-test'] });
  console.log('   📢 Admin promoting student\'s private stroke');
}

function testMultiTab() {
  console.log('\n📋 Test 7: Multi-Tab Support');
  
  const studentTab2 = io('http://localhost:3001', { transports: ['websocket'] });
  
  studentTab2.on('connect', () => {
    console.log('   🔌 Student Tab 2 connected');
    studentTab2.emit('joinRoom', { 
      roomId, 
      userId: 'student-alice' // Same userId as first student
    });
  });

  studentTab2.on('room-joined', (data) => {
    if (data.userId === 'student-alice') {
      console.log('   ✅ Same user joined from second tab');
      
      // Draw from tab 2
      const tab2Stroke = {
        id: 'tab2-stroke',
        points: [[200, 200], [250, 250]],
        color: '#0000FF',
        width: 2
      };

      // Tab 1 should receive it
      studentSocket.once('private-stroke', (stroke) => {
        if (stroke.id === 'tab2-stroke') {
          console.log('   ✅ Tab 1 received stroke from Tab 2 (multi-tab sync)');
          tests.multiTab = true;
          testsPassed++;
          
          studentTab2.disconnect();
          
          // Test 8: Persistence
          setTimeout(() => testPersistence(), 1000);
        }
      });

      studentTab2.emit('private-stroke', tab2Stroke);
      console.log('   📤 Tab 2 sent private stroke');
    }
  });
}

function testPersistence() {
  console.log('\n📋 Test 8: MongoDB Persistence');
  
  // Disconnect everyone
  console.log('   ⏸️  Disconnecting all users...');
  adminSocket.disconnect();
  studentSocket.disconnect();
  
  setTimeout(() => {
    console.log('   🔄 Reconnecting admin to check persistence...');
    
    const adminReconnect = io('http://localhost:3001', { transports: ['websocket'] });
    
    adminReconnect.on('connect', () => {
      adminReconnect.emit('joinRoom', { 
        roomId, 
        userId: 'teacher-bob', 
        adminKey 
      });
    });

    adminReconnect.on('room-joined', (data) => {
      if (data.publicStrokes && data.publicStrokes.length >= 2) {
        console.log(`   ✅ Room reloaded with ${data.publicStrokes.length} public strokes from DB`);
        console.log('   ✅ Public strokes persist across disconnect/reconnect');
        tests.persistence = true;
        testsPassed++;
        
        adminReconnect.disconnect();
        
        // Print summary
        setTimeout(() => printSummary(), 1000);
      } else {
        console.log('   ❌ Public strokes not loaded from DB');
        testsFailed++;
        adminReconnect.disconnect();
        setTimeout(() => printSummary(), 1000);
      }
    });
  }, 3000);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(tests).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${icon} ${name.charAt(0).toUpperCase() + name.slice(1)}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(60));
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL FUNCTIONALITY TESTS PASSED!');
    console.log('\n✅ Verified Features:');
    console.log('   • Room creation with admin key');
    console.log('   • Admin join (with admin key)');
    console.log('   • Student join (without admin key)');
    console.log('   • Admin public drawing (RED)');
    console.log('   • Student private drawing (BLUE)');
    console.log('   • Promote private → public');
    console.log('   • Multi-tab support');
    console.log('   • MongoDB persistence');
    console.log('\n🌐 Open http://localhost:5174 to test UI!');
  } else {
    console.log('\n⚠️ Some tests failed. Check logs above.');
  }
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Start tests
runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
