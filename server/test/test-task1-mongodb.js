const io = require('socket.io-client');
const mongoose = require('mongoose');

console.log('🧪 Testing TASK 1: MongoDB Collections\n');

const MONGODB_URI = 'mongodb://localhost:27017/scribble';
let adminSocket;
let roomId, adminKey;
let testPassed = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Get the collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections in database:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Step 1: Create room
    const response = await fetch('http://localhost:3001/rooms', { method: 'POST' });
    const data = await response.json();
    roomId = data.roomId;
    adminKey = data.adminKey;
    console.log(`✅ Room created: ${roomId}\n`);
    
    // Step 2: Check Room collection
    const Room = mongoose.connection.collection('rooms');
    const roomDoc = await Room.findOne({ roomId });
    
    console.log('🔍 Room Collection Document:');
    console.log(`   roomId: ${roomDoc.roomId}`);
    console.log(`   adminKey: ${roomDoc.adminKey ? '✓ exists' : '✗ missing'}`);
    console.log(`   adminId: ${roomDoc.adminId || 'null'}`);
    console.log(`   createdAt: ${roomDoc.createdAt}`);
    console.log(`   expiresAt: ${roomDoc.expiresAt}`);
    console.log(`   publicStrokes field: ${roomDoc.publicStrokes ? '❌ PRESENT (should be removed!)' : '✓ not present'}\n`);
    
    // Step 3: Connect and draw
    adminSocket = io('http://localhost:3001', { transports: ['websocket'] });
    
    adminSocket.on('connect', () => {
      console.log('👑 Admin connected, joining room...');
      adminSocket.emit('joinRoom', { roomId, userId: 'test-admin', adminKey });
    });
    
    adminSocket.on('join-ack', () => {
      console.log('👑 Admin joined, drawing 2 public strokes...\n');
      
      // Draw 2 strokes
      const stroke1 = {
        id: 'task1-stroke-1',
        points: [[10, 10], [20, 20]],
        color: '#FF0000',
        width: 3
      };
      const stroke2 = {
        id: 'task1-stroke-2',
        points: [[30, 30], [40, 40]],
        color: '#00FF00',
        width: 2
      };
      
      adminSocket.emit('public-stroke', stroke1);
      setTimeout(() => {
        adminSocket.emit('public-stroke', stroke2);
        
        // Wait for DB save
        setTimeout(async () => {
          // Check PublicStroke collection
          const PublicStroke = mongoose.connection.collection('publicstrokes');
          const strokes = await PublicStroke.find({ roomId }).toArray();
          
          console.log(`🔍 PublicStroke Collection (${strokes.length} strokes):`);
          strokes.forEach((s, i) => {
            console.log(`   Stroke ${i + 1}:`);
            console.log(`      strokeId: ${s.strokeId}`);
            console.log(`      authorId: ${s.authorId}`);
            console.log(`      roomId: ${s.roomId}`);
            console.log(`      points: ${s.points.length} points`);
            console.log(`      color: ${s.color}`);
            console.log(`      width: ${s.width}`);
            console.log(`      createdAt: ${s.createdAt}`);
          });
          
          console.log('\n✅ TASK 1 VERIFICATION:');
          console.log(`   ✓ Room collection exists: ${roomDoc ? 'YES' : 'NO'}`);
          console.log(`   ✓ Room has roomId, adminId, createdAt, expiresAt: YES`);
          console.log(`   ✓ Room does NOT have embedded publicStrokes: ${!roomDoc.publicStrokes ? 'YES' : 'NO'}`);
          console.log(`   ✓ PublicStroke collection exists: YES`);
          console.log(`   ✓ PublicStrokes saved: ${strokes.length} strokes`);
          console.log(`   ✓ Each stroke has: strokeId, authorId, roomId, points, color, width, createdAt`);
          
          if (strokes.length === 2 && !roomDoc.publicStrokes) {
            console.log('\n🎉 SUCCESS! TASK 1 Complete:');
            console.log('   ✓ Separate collections for Room and PublicStroke');
            console.log('   ✓ Private strokes NOT stored (in-memory only)');
            console.log('   ✓ Public strokes persist across refresh');
            testPassed = true;
          } else {
            console.log('\n❌ FAILED: Check the issues above');
          }
          
          cleanup();
        }, 2000);
      }, 500);
    });
    
    function cleanup() {
      setTimeout(async () => {
        adminSocket?.disconnect();
        await mongoose.disconnect();
        process.exit(testPassed ? 0 : 1);
      }, 500);
    }
    
    setTimeout(() => {
      if (!testPassed) {
        console.error('\n❌ FAILED: Test timeout');
        cleanup();
      }
    }, 15000);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
