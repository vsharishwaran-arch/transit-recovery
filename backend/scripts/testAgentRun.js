import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

async function testAgent() {
  try {
    const loginRes = await api.post('/auth/login', {
      employeeId: 'TNSTC-ADMIN',
      password: 'admin123',
    });
    const cookie = loginRes.headers['set-cookie'];

    const agentRes = await api.post(
      '/agent/run',
      { batchSize: 20, language: 'hinglish', routeFilter: 'all' },
      { headers: { Cookie: cookie ? cookie[0] : '' } }
    );

    console.log('✅ Agent Execution Successful!');
    console.log('Batch ID:', agentRes.data.batchRun.batchRunId);
    console.log('Scanned:', agentRes.data.batchRun.sessionsScanned);
    console.log('Attempted:', agentRes.data.batchRun.sessionsAttempted);
    console.log('Skipped:', agentRes.data.batchRun.sessionsSkipped);
    console.log('Escalated:', agentRes.data.batchRun.sessionsEscalated);
    console.log('Recovered:', agentRes.data.batchRun.sessionsRecovered);
    console.log('Amount At Risk: ₹' + agentRes.data.batchRun.amountAtRisk);
    console.log('Amount Recovered: ₹' + agentRes.data.batchRun.amountRecovered);
  } catch (err) {
    console.error('Agent test failed:', err.response?.data || err.message);
  }
}

testAgent();
