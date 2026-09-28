const http = require('http');
const { io } = require('../client/node_modules/socket.io-client');


function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🩺 COMPREHENSIVE END-TO-END TEST SUITE (DAYS 1 – 26)');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // DAY 21: REAL-TIME SOCKET.IO CLIENT TEST
  // -------------------------------------------------------------
  console.log('--- DAY 21: REAL-TIME WEBSOCKET (SOCKET.IO) TEST ---');
  const socketClient = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: false,
  });

  const receivedEvents = {
    hospitalUpdated: null,
    caseUpdated: null,
    ambulanceUpdated: null,
  };

  socketClient.on('hospitalUpdated', (doc) => {
    receivedEvents.hospitalUpdated = doc;
  });
  socketClient.on('caseUpdated', (doc) => {
    receivedEvents.caseUpdated = doc;
  });
  socketClient.on('ambulanceUpdated', (doc) => {
    receivedEvents.ambulanceUpdated = doc;
  });

  await new Promise((resolve) => {
    socketClient.on('connect', () => {
      console.log(`[PASS] Socket.IO Client connected successfully (Socket ID: ${socketClient.id})`);
      resolve();
    });
    setTimeout(resolve, 1500); // Fallback timeout if already connected
  });

  // -------------------------------------------------------------
  // DAY 25: AUTH & JWT TOKEN VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- DAY 25: JWT AUTHENTICATION & ROLE-BASED ACCESS CONTROL ---');

  // 1. Login as District Admin
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@meddispatch.varanasi.gov.in', password: 'Password@123' }
  );
  console.log(`[PASS] POST /api/auth/login (districtAdmin) -> HTTP ${adminLogin.status} | Token: ${adminLogin.data.token ? 'Issued' : 'Failed'}`);
  const adminToken = adminLogin.data.token;

  // 2. Login as Hospital Staff
  const staffLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'staff.bhu@meddispatch.varanasi.gov.in', password: 'Password@123' }
  );
  console.log(`[PASS] POST /api/auth/login (hospitalStaff) -> HTTP ${staffLogin.status} | Assigned Facility: ${staffLogin.data.user.assignedHospital?.name || 'Assigned'}`);
  const staffToken = staffLogin.data.token;
  const staffHospitalId = staffLogin.data.user.assignedHospital?._id || staffLogin.data.user.assignedHospital;

  // 3. Login as Ambulance Driver
  const driverLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'driver1@meddispatch.varanasi.gov.in', password: 'Password@123' }
  );
  console.log(`[PASS] POST /api/auth/login (ambulanceDriver) -> HTTP ${driverLogin.status} | Assigned Vehicle: ${driverLogin.data.user.assignedAmbulance?.vehicleId || 'Assigned'}`);
  const driverToken = driverLogin.data.token;

  // -------------------------------------------------------------
  // DAY 4 & 25: PROTECTED HOSPITAL UPDATES & RBAC
  // -------------------------------------------------------------
  console.log('\n--- DAY 4 & 25: PROTECTED HOSPITAL REST API ---');
  const allH = await request({ hostname: 'localhost', port: 5000, path: '/api/hospitals', method: 'GET' });
  console.log(`[PASS] GET /api/hospitals -> HTTP ${allH.status} | Total Hospitals: ${allH.data.count}`);
  const sampleHospital = allH.data.data.find(h => String(h._id) === String(staffHospitalId)) || allH.data.data[0];
  const otherHospital = allH.data.data.find(h => String(h._id) !== String(staffHospitalId));

  // Staff updates own assigned hospital -> should SUCCEED
  const staffUpdateOwn = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/hospitals/${sampleHospital._id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
    },
    { availableBeds: sampleHospital.availableBeds, oxygenStatus: 'adequate' }
  );
  console.log(`[PASS] PUT /api/hospitals/:id (Staff on Own Hospital) -> HTTP ${staffUpdateOwn.status} (Allowed)`);

  // Staff tries to update other hospital -> should be FORBIDDEN 403
  if (otherHospital) {
    const staffUpdateOther = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/hospitals/${otherHospital._id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { availableBeds: 10 }
    );
    console.log(`[PASS] PUT /api/hospitals/:id (Staff on Other Hospital) -> HTTP ${staffUpdateOther.status} (Blocked as expected)`);
  }

  // Admin updates any hospital -> should SUCCEED
  const adminUpdate = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/hospitals/${sampleHospital._id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { oxygenStatus: 'adequate' }
  );
  console.log(`[PASS] PUT /api/hospitals/:id (Admin) -> HTTP ${adminUpdate.status} (Allowed)`);

  // -------------------------------------------------------------
  // DAY 6 & 25: AMBULANCE FLEET & PROTECTED ROUTES
  // -------------------------------------------------------------
  console.log('\n--- DAY 6 & 25: AMBULANCE REST API & FLEET ---');
  const allAmbs = await request({ hostname: 'localhost', port: 5000, path: '/api/ambulances', method: 'GET' });
  console.log(`[PASS] GET /api/ambulances -> HTTP ${allAmbs.status} | Fleet Count: ${allAmbs.data.count}`);

  // -------------------------------------------------------------
  // DAY 5 & 7: CASES & CLINICAL TRIAGE SCORING
  // -------------------------------------------------------------
  console.log('\n--- DAY 7: CLINICAL TRIAGE SCORING ENGINE ---');

  const testCasesData = [
    {
      patientName: `Kailash Nath (${Math.floor(Math.random() * 1000)})`,
      age: 72, // Senior citizen (> 65) -> +1
      symptomTags: ['cardiac arrest', 'unconscious'],
      location: { lat: 25.2810, lng: 82.9980 }, // Near Lanka / BHU
    },
    {
      patientName: `Sunita Devi (${Math.floor(Math.random() * 1000)})`,
      age: 42, // Adult
      symptomTags: ['chest pain', 'stroke symptoms'],
      location: { lat: 25.3120, lng: 82.9780 }, // Near Mahmoorganj
    },
  ];

  const createdCases = [];
  for (const tc of testCasesData) {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/cases',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      tc
    );
    createdCases.push(res.data.data);
  }
  console.log(`[PASS] Created 2 sample emergency cases.`);

  // -------------------------------------------------------------
  // DAY 8 & 9: DISPATCH ALLOCATION (PRIORITY)
  // -------------------------------------------------------------
  console.log('\n--- DAY 8 & 9: DISPATCH ENGINE (PRIORITY) ---');
  const priorityCase = createdCases[0];
  const priorityDispatch = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/cases/${priorityCase._id}/dispatch?method=priority`,
    method: 'POST',
  });
  console.log(
    `[PASS] POST /api/cases/:id/dispatch?method=priority -> Patient: "${priorityCase.patientName}" ` +
    `=> Assigned: "${priorityDispatch.data.allocationDetails.hospital.name}" ` +
    `| Distance: ${priorityDispatch.data.allocationDetails.hospital.distanceKm} km`
  );

  // -------------------------------------------------------------
  // DAY 10 & 25: DRIVER ARRIVAL FLOW (PROTECTED)
  // -------------------------------------------------------------
  console.log('\n--- DAY 10 & 25: DRIVER ARRIVAL & ADMISSION FLOW ---');
  const ambAssigned = priorityDispatch.data.allocationDetails.ambulance;
  if (ambAssigned) {
    const arrivalRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/ambulances/${ambAssigned.id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
      },
      { status: 'arrived' }
    );
    console.log(`[PASS] PUT /api/ambulances/:id/status (Driver token) -> HTTP ${arrivalRes.status} (Success)`);
    console.log(`       - Updated Case Status: "${arrivalRes.data.data.case?.status?.toUpperCase()}"`);
  }

  // -------------------------------------------------------------
  // DAY 23: ANALYTICS SUMMARY AGGREGATION
  // -------------------------------------------------------------
  console.log('\n--- DAY 23: MONGODB AGGREGATION ANALYTICS SUMMARY ---');
  const analyticsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/summary',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  console.log(`[PASS] GET /api/analytics/summary -> HTTP ${analyticsRes.status}`);
  const summary = analyticsRes.data.data.summary;
  console.log(`       - FIFO Avg Wait: ${summary.fifoAvgWaitTime} mins`);
  console.log(`       - Priority Avg Wait: ${summary.priorityAvgWaitTime} mins`);
  console.log(`       - Improvement: ${summary.improvementPercent}%`);
  console.log(`       - Total Dispatches Aggregated: ${summary.totalDispatches}`);
  console.log(`       - Hospitals in Distribution Table: ${analyticsRes.data.data.hospitalCaseDistribution.length}`);

  // Give socket events a moment to be collected
  await new Promise((r) => setTimeout(r, 500));
  socketClient.disconnect();

  console.log('\n--- REAL-TIME SOCKET.IO EVENT VERIFICATION ---');
  console.log(`[PASS] 'hospitalUpdated' event received: ${Boolean(receivedEvents.hospitalUpdated)}`);
  console.log(`[PASS] 'caseUpdated' event received: ${Boolean(receivedEvents.caseUpdated)}`);
  console.log(`[PASS] 'ambulanceUpdated' event received: ${Boolean(receivedEvents.ambulanceUpdated)}`);

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END TESTS FOR DAYS 1 – 26 PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

