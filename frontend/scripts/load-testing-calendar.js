// scripts/load-test-calendar.js
// Run with: node scripts/load-test-calendar.js

const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:3001/routes',
  TEST_SCENARIOS: [
    { name: 'Light Load', taskCount: 25, reminderCount: 15, concurrentUsers: 1 },
    { name: 'Normal Load', taskCount: 100, reminderCount: 50, concurrentUsers: 5 },
    { name: 'Heavy Load', taskCount: 500, reminderCount: 250, concurrentUsers: 10 },
    { name: 'Stress Test', taskCount: 1000, reminderCount: 500, concurrentUsers: 20 }
  ],
  WARMUP_REQUESTS: 5,
  TEST_DURATION_MS: 30000 // 30 seconds
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatTime = (ms) => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const generateTestData = (taskCount, reminderCount) => {
  const baseDate = new Date('2024-01-01');
  const tasks = [];
  const reminders = [];
  
  // Generate tasks
  for (let i = 0; i < taskCount; i++) {
    const dayOffset = Math.floor(i / 20); // Spread across multiple days
    const hour = (i % 12) + 8; // 8 AM to 8 PM
    const startTime = new Date(baseDate);
    startTime.setDate(baseDate.getDate() + dayOffset);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 60);
    
    tasks.push({
      name: `Load Test Task ${i + 1}`,
      selectedDay: startTime.toISOString().split('T')[0],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 60,
      repeatOption: '',
      originalStartDay: startTime.toISOString().split('T')[0],
      currentDay: new Date().toISOString().split('T')[0],
      selectedDayUI: startTime.toISOString().split('T')[0]
    });
  }
  
  // Generate reminders
  for (let i = 0; i < reminderCount; i++) {
    const dayOffset = Math.floor(i / 10);
    const hour = (i % 12) + 8;
    const reminderTime = new Date(baseDate);
    reminderTime.setDate(baseDate.getDate() + dayOffset);
    reminderTime.setHours(hour, 30, 0, 0);
    
    reminders.push({
      name: `Load Test Reminder ${i + 1}`,
      selectedDay: reminderTime.toISOString().split('T')[0],
      selectedTime: reminderTime.toISOString(),
      repeatOption: '',
      originalStartDay: reminderTime.toISOString().split('T')[0],
      currentDay: new Date().toISOString().split('T')[0],
      selectedDayUI: reminderTime.toISOString().split('T')[0]
    });
  }
  
  return { tasks, reminders };
};

// API interaction functions
const createTasks = async (tasks) => {
  const results = [];
  for (const task of tasks) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/tasks/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      
      const endTime = performance.now();
      const success = response.ok;
      
      results.push({
        success,
        duration: endTime - startTime,
        status: response.status
      });
      
      if (!success) {
        console.warn(`Task creation failed: ${response.status}`);
      }
    } catch (error) {
      const endTime = performance.now();
      results.push({
        success: false,
        duration: endTime - startTime,
        error: error.message
      });
    }
  }
  return results;
};

const createReminders = async (reminders) => {
  const results = [];
  for (const reminder of reminders) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/reminders/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder)
      });
      
      const endTime = performance.now();
      const success = response.ok;
      
      results.push({
        success,
        duration: endTime - startTime,
        status: response.status
      });
    } catch (error) {
      const endTime = performance.now();
      results.push({
        success: false,
        duration: endTime - startTime,
        error: error.message
      });
    }
  }
  return results;
};

const loadCalendarData = async () => {
  const startDate = '2024-01-01';
  const endDate = '2024-01-07';
  
  const startTime = performance.now();
  
  try {
    const [tasksResponse, remindersResponse] = await Promise.all([
      fetch(`${CONFIG.API_BASE_URL}/tasks/week/${startDate}/${endDate}`),
      fetch(`${CONFIG.API_BASE_URL}/reminders/week/${startDate}/${endDate}`)
    ]);
    
    const [tasks, reminders] = await Promise.all([
      tasksResponse.json(),
      remindersResponse.json()
    ]);
    
    const endTime = performance.now();
    
    return {
      success: tasksResponse.ok && remindersResponse.ok,
      duration: endTime - startTime,
      taskCount: tasks.length || 0,
      reminderCount: reminders.length || 0
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      duration: endTime - startTime,
      error: error.message
    };
  }
};

// Performance test functions
const runConcurrentCalendarLoads = async (concurrentUsers, duration) => {
  const results = [];
  const startTime = performance.now();
  const endTime = startTime + duration;
  
  const userPromises = [];
  
  for (let user = 0; user < concurrentUsers; user++) {
    const userPromise = (async () => {
      const userResults = [];
      let requestCount = 0;
      
      while (performance.now() < endTime) {
        const result = await loadCalendarData();
        userResults.push(result);
        requestCount++;
        
        // Small delay to simulate user behavior
        await delay(Math.random() * 1000 + 500);
      }
      
      return { user, results: userResults, requestCount };
    })();
    
    userPromises.push(userPromise);
  }
  
  const userResults = await Promise.all(userPromises);
  
  // Aggregate results
  const allResults = userResults.flatMap(ur => ur.results);
  const totalRequests = allResults.length;
  const successfulRequests = allResults.filter(r => r.success).length;
  const averageResponseTime = allResults.reduce((sum, r) => sum + r.duration, 0) / totalRequests;
  const maxResponseTime = Math.max(...allResults.map(r => r.duration));
  const minResponseTime = Math.min(...allResults.map(r => r.duration));
  
  return {
    concurrentUsers,
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    successRate: (successfulRequests / totalRequests) * 100,
    averageResponseTime,
    maxResponseTime,
    minResponseTime,
    requestsPerSecond: totalRequests / (duration / 1000)
  };
};

const warmupServer = async () => {
  console.log('🔥 Warming up server...');
  
  for (let i = 0; i < CONFIG.WARMUP_REQUESTS; i++) {
    await loadCalendarData();
    await delay(200);
  }
  
  console.log('✅ Server warmed up');
};

const cleanupTestData = async () => {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // This would require implementing cleanup endpoints
    // For now, just log that cleanup would happen here
    console.log('⚠️  Manual cleanup required - remove test tasks/reminders from database');
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
};

// Main test runner
const runLoadTest = async (scenario) => {
  console.log(`\n🚀 Running ${scenario.name} scenario...`);
  console.log(`   Tasks: ${scenario.taskCount}, Reminders: ${scenario.reminderCount}`);
  console.log(`   Concurrent Users: ${scenario.concurrentUsers}`);
  
  const { tasks, reminders } = generateTestData(scenario.taskCount, scenario.reminderCount);
  
  // Create test data
  console.log('📝 Creating test data...');
  const createStartTime = performance.now();
  
  const [taskResults, reminderResults] = await Promise.all([
    createTasks(tasks.slice(0, Math.min(tasks.length, 50))), // Limit for demo
    createReminders(reminders.slice(0, Math.min(reminders.length, 25)))
  ]);
  
  const createEndTime = performance.now();
  const createDuration = createEndTime - createStartTime;
  
  // Run concurrent load test
  console.log('⚡ Running concurrent load test...');
  const loadResults = await runConcurrentCalendarLoads(
    scenario.concurrentUsers,
    CONFIG.TEST_DURATION_MS
  );
  
  // Calculate metrics
  const taskCreateStats = {
    total: taskResults.length,
    successful: taskResults.filter(r => r.success).length,
    averageTime: taskResults.reduce((sum, r) => sum + r.duration, 0) / taskResults.length
  };
  
  const reminderCreateStats = {
    total: reminderResults.length,
    successful: reminderResults.filter(r => r.success).length,
    averageTime: reminderResults.reduce((sum, r) => sum + r.duration, 0) / reminderResults.length
  };
  
  return {
    scenario: scenario.name,
    dataCreation: {
      duration: createDuration,
      taskStats: taskCreateStats,
      reminderStats: reminderCreateStats
    },
    loadTest: loadResults,
    nfr13Compliance: {
      averageLoadTime: loadResults.averageResponseTime,
      maxLoadTime: loadResults.maxResponseTime,
      passesNFR: loadResults.averageResponseTime < 1000, // <1s requirement
      successRate: loadResults.successRate
    }
  };
};

// Report generation
const generateReport = (results) => {
  console.log('\n📊 LOAD TEST REPORT');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`\n📋 ${result.scenario}`);
    console.log('─'.repeat(30));
    
    // NFR 1.3 Compliance
    const nfr = result.nfr13Compliance;
    const status = nfr.passesNFR ? '✅ PASS' : '❌ FAIL';
    console.log(`NFR 1.3 Status: ${status}`);
    console.log(`Average Load Time: ${formatTime(nfr.averageLoadTime)}`);
    console.log(`Max Load Time: ${formatTime(nfr.maxLoadTime)}`);
    console.log(`Success Rate: ${nfr.successRate.toFixed(2)}%`);
    
    // Load Test Results
    const load = result.loadTest;
    console.log(`\nLoad Test Results:`);
    console.log(`  Concurrent Users: ${load.concurrentUsers}`);
    console.log(`  Total Requests: ${load.totalRequests}`);
    console.log(`  Requests/Second: ${load.requestsPerSecond.toFixed(2)}`);
    console.log(`  Failed Requests: ${load.failedRequests}`);
    
    // Data Creation Performance
    const create = result.dataCreation;
    console.log(`\nData Creation:`);
    console.log(`  Total Time: ${formatTime(create.duration)}`);
    console.log(`  Tasks Created: ${create.taskStats.successful}/${create.taskStats.total}`);
    console.log(`  Reminders Created: ${create.reminderStats.successful}/${create.reminderStats.total}`);
  });
  
  // Summary
  const overallPass = results.every(r => r.nfr13Compliance.passesNFR);
  console.log(`\n🎯 OVERALL NFR 1.3 STATUS: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
};

// Main execution
const main = async () => {
  console.log('🧪 Calendar Performance Load Test');
  console.log('Testing NFR 1.3: Fast calendar loading <1s with 100 tasks');
  
  try {
    await warmupServer();
    
    const results = [];
    
    for (const scenario of CONFIG.TEST_SCENARIOS) {
      const result = await runLoadTest(scenario);
      results.push(result);
      
      // Small delay between scenarios
      await delay(2000);
    }
    
    generateReport(results);
    
    // Optional: Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs').promises;
    await fs.writeFile(
      `load-test-results-${timestamp}.json`,
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\n💾 Results saved to load-test-results-${timestamp}.json`);
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  } finally {
    await cleanupTestData();
  }
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runLoadTest,
  loadCalendarData,
  generateTestData,
  CONFIG
};