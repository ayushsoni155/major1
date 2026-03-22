const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'api-test-results.md');

let logContent = '# API Test Results\\n\\n';
let cookieHeader = '';
const API_URL = 'http://localhost/api';

function log(text) {
  console.log(text);
  logContent += text + '\\n';
}

function logResult(method, url, requestBody, status, responseBody) {
  log(`### ${method} ${url}`);
  if (requestBody) {
    log('**Input**:\\n```json\\n' + JSON.stringify(requestBody, null, 2) + '\\n```');
  } else {
    log('**Input**: None');
  }
  log(`**Status**: ${status}`);
  log('**Output**:\\n```json\\n' + JSON.stringify(responseBody, null, 2) + '\\n```\\n---');
}

async function jsonFetch(endpoint, method, body, cookies = '', extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (cookies) headers['Cookie'] = cookies;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, options);
  } catch (e) {
    return { status: 500, body: e.message };
  }
  
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookieHeader = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
  }
  
  let resBody;
  try {
    resBody = await res.json();
  } catch {
    resBody = await res.text();
  }
  
  logResult(method, endpoint, body, res.status, resBody);
  return { status: res.status, body: resBody };
}

async function testAllAPIs() {
  log('## Service: Auth Service');
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password@123';
  
  // Register
  const regRes = await jsonFetch('/auth/register', 'POST', { email, password, name: 'Full Test User' });
  
  // Get OTP from DB
  const client = new Client({
    connectionString: 'postgresql://rapidbase:rapidbase_secret_2024@localhost:5432/rapidbase'
  });
  await client.connect();
  const dbRes = await client.query('SELECT otp_code FROM users WHERE email = $1', [email]);
  const otp = dbRes.rows[0].otp_code;
  await client.end();
  
  // Verify OTP
  const verifyRes = await jsonFetch('/auth/verify-otp', 'POST', { email, otp });
  
  // Login
  await jsonFetch('/auth/login', 'POST', { email, password });
  
  // Get Me
  const meRes = await jsonFetch('/auth/me', 'GET', null, cookieHeader);
  const userId = meRes.body?.data?.id;

  log('\\n## Service: Project Service');
  // Create Project
  const projRes = await jsonFetch('/projects/', 'POST', { name: "Full API Test Project", description: "Testing all routes" }, cookieHeader);
  let projectId = projRes.body?.data?.project_id || projRes.body?.data?.id || (projRes.body?.data?.project ? projRes.body.data.project.id : null);
  
  if (!projectId && projRes.status === 201) {
    projectId = projRes.body?.data?.project_id;
  }

  // Get Projects
  await jsonFetch('/projects/', 'GET', null, cookieHeader);
  
  if (projectId) {
    // Get Project Details
    await jsonFetch(`/projects/${projectId}`, 'GET', null, cookieHeader);
    
    // Update Project
    await jsonFetch(`/projects/${projectId}`, 'PATCH', { description: "Updated description" }, cookieHeader);

    log('\\n### Sub-Service: Schema & Tables');
    // Get Schema Structure
    await jsonFetch(`/schema/${projectId}`, 'GET', null, cookieHeader);

    // Create Table
    const tableRes = await jsonFetch(`/projects/${projectId}/tables`, 'POST', {
      tableName: "test_employees",
      columns: [
        { name: "emp_name", type: "text" },
        { name: "age", type: "numeric" }
      ]
    }, cookieHeader);
    
    // Get Project Tables
    await jsonFetch(`/projects/${projectId}/tables`, 'GET', null, cookieHeader);
    
    let tableId = null;
    if (tableRes.status === 201) {
        tableId = tableRes.body?.data?.[0]?.table_id || tableRes.body?.data?.id;
    }

    if (tableId) {
      // Get Table Details
      await jsonFetch(`/projects/${projectId}/tables/${tableId}`, 'GET', null, cookieHeader);
      
      // Insert Data
      await jsonFetch(`/projects/${projectId}/tables/${tableId}/data`, 'POST', { emp_name: "John Doe", age: 30 }, cookieHeader);
      
      // Get Table Data
      await jsonFetch(`/projects/${projectId}/tables/${tableId}/data`, 'GET', null, cookieHeader);

      log('\\n## Service: Database (Query) Service');
      // Execute Query
      await jsonFetch('/query/execute', 'POST', {
        projectId,
        query: "SELECT COUNT(*) FROM test_employees"
      }, cookieHeader);

      // Query history
      await jsonFetch(`/query/history?projectId=${projectId}`, 'GET', null, cookieHeader);

      // Audit Logs
      await jsonFetch(`/auditlog/?projectId=${projectId}`, 'GET', null, cookieHeader);

      log('\\n## Service: Analytics Service');
      // Get Tables stats (requires passing project id usually via header x-project-id, wait let's just make the call)
      await jsonFetch(`/analytics/tables`, 'GET', null, cookieHeader);
      await jsonFetch(`/analytics/tables/test_employees/columns`, 'GET', null, cookieHeader);
      await jsonFetch(`/analytics/chart?tableName=test_employees&xAxis=emp_name&yAxis=age&type=bar`, 'GET', null, cookieHeader);
      await jsonFetch(`/analytics/stats?tableName=test_employees`, 'GET', null, cookieHeader);

      log('\\n### Cleanup');
      // Delete Row (we need a row id, let's skip to delete table)
      await jsonFetch(`/projects/${projectId}/tables/${tableId}`, 'DELETE', null, cookieHeader);
    }

    // API Keys
    const apiKeyRes = await jsonFetch(`/projects/${projectId}/keys`, 'POST', { name: "Test Key" }, cookieHeader);
    let keyId = null;
    let apiKey = null;
    if (apiKeyRes.status === 201) {
       keyId = apiKeyRes.body?.data?.id;
       apiKey = apiKeyRes.body?.data?.key;
    }
    
    await jsonFetch(`/projects/${projectId}/keys`, 'GET', null, cookieHeader);
    
    if (apiKey) {
      log('\\n## Service: PostgREST API');
      const restHeaders = { 'x-api-key': apiKey };
      
      // Select
      await jsonFetch(`/rest/test_employees`, 'GET', null, cookieHeader, restHeaders);
      
      // Insert
      await jsonFetch(`/rest/test_employees`, 'POST', { emp_name: "REST API User", age: 40 }, cookieHeader, restHeaders);
      
      // Select again
      await jsonFetch(`/rest/test_employees?emp_name=eq.REST API User`, 'GET', null, cookieHeader, restHeaders);
    }

    if (keyId) {
       await jsonFetch(`/projects/${projectId}/keys/${keyId}`, 'DELETE', null, cookieHeader);
    }

    // Members
    log('\\n### Sub-Service: Members');
    await jsonFetch(`/projects/${projectId}/members`, 'GET', null, cookieHeader);

    // Finally Delete Project
    await jsonFetch(`/projects/${projectId}`, 'DELETE', null, cookieHeader);
  }

  log('\\n## Auth - Logout');
  await jsonFetch('/auth/logout', 'POST', null, cookieHeader);

  fs.writeFileSync(OUTPUT_FILE, logContent);
  console.log(`Test run complete. Output written to ${OUTPUT_FILE}`);
}

testAllAPIs();
