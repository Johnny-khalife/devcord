import { io } from 'socket.io-client';
import { connectSockets, disconnectSockets, sendDirectMessage, sendChannelMessage, joinChannel, sendTypingIndicator } from './src/lib/socket';
import { useChatStore } from './src/store/chatStore';
import { useAuthStore } from './src/store/useAuthStore';

/**
 * Helper script to test socket functionality
 * This can be run from the command line with:
 * node test-socket.js
 */

// Mock data for testing
const TEST_USER_ID = '67dc44642a8b77273e010d4c'; // Replace with an actual user ID from your system
const TEST_CHANNEL_ID = '67dc446c2a8b77273e010d52'; // Replace with an actual channel ID from your system
const TEST_MESSAGE = 'This is a test message from the socket test script';

// Initialize stores
const chatStore = useChatStore.getState();
const authStore = useAuthStore.getState();

console.log('========================================');
console.log('    Dev-Chat Socket Testing Script');
console.log('========================================');
console.log('1. Initialize store references');
console.log('2. Connect to sockets');
console.log('3. Send a test direct message');
console.log('4. Join a test channel');
console.log('5. Send a test channel message');
console.log('6. Send typing indicators');
console.log('7. Disconnect and clean up');
console.log('========================================');

// Function to run the test sequence
async function runSocketTest() {
  try {
    console.log('\n🔄 Starting socket test sequence...');
    
    // Step 1: Set up store references for socket usage
    console.log('\n🔄 Step 1: Initialize store references');
    // This would normally be done by the app at startup
    
    // Step 2: Connect to sockets
    console.log('\n🔄 Step 2: Connecting to sockets...');
    const sockets = connectSockets();
    console.log('Socket connection result:', sockets.dm ? 'DM Connected ✅' : 'DM Failed ❌', 
                                           sockets.channels ? 'Channels Connected ✅' : 'Channels Failed ❌');
    
    // Give some time for connections to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Send a test direct message
    console.log('\n🔄 Step 3: Sending a test direct message...');
    const dmSent = sendDirectMessage(TEST_USER_ID, TEST_MESSAGE);
    console.log('DM message sent:', dmSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Join a test channel
    console.log('\n🔄 Step 4: Joining a test channel...');
    const joinedChannel = joinChannel(TEST_CHANNEL_ID);
    console.log('Joined channel:', joinedChannel ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Send a test channel message
    console.log('\n🔄 Step 5: Sending a test channel message...');
    const channelMsgSent = sendChannelMessage(TEST_CHANNEL_ID, TEST_MESSAGE);
    console.log('Channel message sent:', channelMsgSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 6: Send typing indicators
    console.log('\n🔄 Step 6: Sending typing indicators...');
    const typingStartSent = sendTypingIndicator(TEST_USER_ID, true);
    console.log('Typing start indicator sent:', typingStartSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const typingStopSent = sendTypingIndicator(TEST_USER_ID, false);
    console.log('Typing stop indicator sent:', typingStopSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 7: Disconnect and clean up
    console.log('\n🔄 Step 7: Disconnecting sockets...');
    disconnectSockets();
    console.log('Sockets disconnected ✅');
    
    console.log('\n✅ Socket test sequence completed!');
    console.log('Check the logs above for any issues.');
    console.log('For more detailed testing, use the socket-test.html page in a browser.');
    
  } catch (error) {
    console.error('❌ Error during socket test:', error);
  }
}

// Run the test
runSocketTest().then(() => {
  console.log('\nTest script finished. Exiting...');
}); 
import { connectSockets, disconnectSockets, sendDirectMessage, sendChannelMessage, joinChannel, sendTypingIndicator } from './src/lib/socket';
import { useChatStore } from './src/store/chatStore';
import { useAuthStore } from './src/store/useAuthStore';

/**
 * Helper script to test socket functionality
 * This can be run from the command line with:
 * node test-socket.js
 */

// Mock data for testing
const TEST_USER_ID = '67dc44642a8b77273e010d4c'; // Replace with an actual user ID from your system
const TEST_CHANNEL_ID = '67dc446c2a8b77273e010d52'; // Replace with an actual channel ID from your system
const TEST_MESSAGE = 'This is a test message from the socket test script';

// Initialize stores
const chatStore = useChatStore.getState();
const authStore = useAuthStore.getState();

console.log('========================================');
console.log('    Dev-Chat Socket Testing Script');
console.log('========================================');
console.log('1. Initialize store references');
console.log('2. Connect to sockets');
console.log('3. Send a test direct message');
console.log('4. Join a test channel');
console.log('5. Send a test channel message');
console.log('6. Send typing indicators');
console.log('7. Disconnect and clean up');
console.log('========================================');

// Function to run the test sequence
async function runSocketTest() {
  try {
    console.log('\n🔄 Starting socket test sequence...');
    
    // Step 1: Set up store references for socket usage
    console.log('\n🔄 Step 1: Initialize store references');
    // This would normally be done by the app at startup
    
    // Step 2: Connect to sockets
    console.log('\n🔄 Step 2: Connecting to sockets...');
    const sockets = connectSockets();
    console.log('Socket connection result:', sockets.dm ? 'DM Connected ✅' : 'DM Failed ❌', 
                                           sockets.channels ? 'Channels Connected ✅' : 'Channels Failed ❌');
    
    // Give some time for connections to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Send a test direct message
    console.log('\n🔄 Step 3: Sending a test direct message...');
    const dmSent = sendDirectMessage(TEST_USER_ID, TEST_MESSAGE);
    console.log('DM message sent:', dmSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Join a test channel
    console.log('\n🔄 Step 4: Joining a test channel...');
    const joinedChannel = joinChannel(TEST_CHANNEL_ID);
    console.log('Joined channel:', joinedChannel ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Send a test channel message
    console.log('\n🔄 Step 5: Sending a test channel message...');
    const channelMsgSent = sendChannelMessage(TEST_CHANNEL_ID, TEST_MESSAGE);
    console.log('Channel message sent:', channelMsgSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 6: Send typing indicators
    console.log('\n🔄 Step 6: Sending typing indicators...');
    const typingStartSent = sendTypingIndicator(TEST_USER_ID, true);
    console.log('Typing start indicator sent:', typingStartSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const typingStopSent = sendTypingIndicator(TEST_USER_ID, false);
    console.log('Typing stop indicator sent:', typingStopSent ? '✅' : '❌');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 7: Disconnect and clean up
    console.log('\n🔄 Step 7: Disconnecting sockets...');
    disconnectSockets();
    console.log('Sockets disconnected ✅');
    
    console.log('\n✅ Socket test sequence completed!');
    console.log('Check the logs above for any issues.');
    console.log('For more detailed testing, use the socket-test.html page in a browser.');
    
  } catch (error) {
    console.error('❌ Error during socket test:', error);
  }
}

// Run the test
runSocketTest().then(() => {
  console.log('\nTest script finished. Exiting...');
}); 