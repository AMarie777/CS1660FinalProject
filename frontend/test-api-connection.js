/**
 * Test script to verify API connection
 * Run with: node test-api-connection.js <API_BASE_URL>
 */

const API_BASE_URL = process.argv[2] || '';

if (!API_BASE_URL) {
  console.log('Usage: node test-api-connection.js <API_BASE_URL>');
  console.log('Example: node test-api-connection.js https://abc123.execute-api.us-east-2.amazonaws.com/prod');
  process.exit(1);
}

const endpoints = [
  { method: 'GET', path: '/game/range', name: 'Get Today Game' },
  { method: 'GET', path: '/game/status', name: 'Get Game Status' },
  { method: 'GET', path: '/user/points', name: 'Get User Points' },
  { method: 'GET', path: '/leaderboard', name: 'Get Leaderboard' },
  { method: 'GET', path: '/model/metadata', name: 'Get Model Metadata' },
  { method: 'POST', path: '/game/guess', name: 'Submit Guess', body: { userGuess: 145.50, userId: 'test', username: 'Test User' } },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${API_BASE_URL}${endpoint.path}`;
    console.log(`\n🧪 Testing ${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(url, options);
    const status = response.ok ? '✅' : '❌';
    const data = await response.json().catch(() => ({ error: 'No JSON response' }));
    
    console.log(`${status} Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2).slice(0, 200));
    
    return { success: response.ok, status: response.status };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`\n🚀 Testing API Connection: ${API_BASE_URL}\n`);
  console.log('='.repeat(60));
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All API endpoints are working!');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check the errors above.');
  }
}

runTests().catch(console.error);

