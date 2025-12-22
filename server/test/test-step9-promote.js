const io = require('socket.io-client');

console.log('🧪 Testing Step 9: Promote Private → Public Stroke\n');

let adminSocket, audienceSocket;
let roomId, adminKey;
let testPassed = false;
let adminPublicCount = 0;
let audiencePublicCount = 0;

// Step 1: Create room
fetch('http://localhost:3001/rooms', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    roomId = data.roomId;
    adminKey = data.adminKey;
    console.log(`✅ Room: ${roomId}`);
    console.log(`🔑 Admin Key: ${adminKey}\n`);

    // Step 2: Connect admin
    adminSocket = io('http://localhost:3001', { transports: ['websocket'] });

    adminSocket.on('connect', () => {
      console.log('👑 Admin connected');
      
      // Join as admin
      adminSocket.emit('joinRoom', { roomId, userId: 'admin-user', adminKey });
    });

    adminSocket.on('join-ack', (data) => {
      console.log('👑 Admin joined as admin:', data.isAdmin);
      
      // Connect audience
      audienceSocket = io('http://localhost:3001', { transports: ['websocket'] });

      audienceSocket.on('connect', () => {
        console.log('👤 Audience connected');
        
        // Join as audience
        audienceSocket.emit('joinRoom', { roomId, userId: 'student-alice' });
      });

      audienceSocket.on('join-ack', (audienceData) => {
        console.log('👤 Audience joined as audience:', audienceData.isAdmin);
        console.log('\n📝 Audience drawing private stroke...');
        
        // Audience draws private stroke
        const privateStroke = {
          id: 'private-stroke-1',
          points: [[100, 100], [200, 200]],
          color: '#0000FF',
          width: 3
        };
        
        audienceSocket.emit('private-stroke', privateStroke);
        console.log('✅ Private stroke sent:', privateStroke.id);
        
        // Wait for stroke to be processed
        setTimeout(() => {
          console.log('\n📢 Admin promoting private stroke to public...');
          adminSocket.emit('promote-stroke', { strokeIds: ['private-stroke-1'] });
        }, 1000);
      });

      // Audience receives public stroke after promotion
      audienceSocket.on('public-stroke', (stroke) => {
        audiencePublicCount++;
        console.log('👤 Audience received PUBLIC stroke:', stroke.id);
        
        if (stroke.id === 'private-stroke-1') {
          console.log('✅ Audience sees promoted stroke as public!');
          checkSuccess();
        }
      });

      audienceSocket.on('stroke-promoted', (data) => {
        console.log('👤 Audience notified of promotion:', data);
      });
    });

    // Admin receives public stroke after promotion
    adminSocket.on('public-stroke', (stroke) => {
      adminPublicCount++;
      console.log('👑 Admin received PUBLIC stroke:', stroke.id);
      
      if (stroke.id === 'private-stroke-1') {
        console.log('✅ Admin sees promoted stroke as public!');
        checkSuccess();
      }
    });

    adminSocket.on('stroke-promoted', (data) => {
      console.log('👑 Admin notified of promotion:', data);
    });

    function checkSuccess() {
      if (adminPublicCount > 0 && audiencePublicCount > 0) {
        testPassed = true;
        console.log('\n🎉 SUCCESS! Private stroke promoted to public!');
        console.log('   ✓ Admin saw promoted stroke');
        console.log('   ✓ Audience saw promoted stroke');
        console.log('   ✓ Everyone can now see it!');
        cleanup();
      }
    }

    function cleanup() {
      setTimeout(() => {
        adminSocket?.disconnect();
        audienceSocket?.disconnect();
        process.exit(testPassed ? 0 : 1);
      }, 500);
    }

    // Timeout
    setTimeout(() => {
      if (!testPassed) {
        console.error('\n❌ FAILED: Promotion did not complete in time');
        console.log(`   Admin public strokes: ${adminPublicCount}`);
        console.log(`   Audience public strokes: ${audiencePublicCount}`);
        cleanup();
      }
    }, 10000);
  })
  .catch(err => {
    console.error('❌ Failed to create room:', err.message);
    process.exit(1);
  });
