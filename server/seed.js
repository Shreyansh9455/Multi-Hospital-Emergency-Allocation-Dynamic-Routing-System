const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { Hospital, Ambulance, Case, DispatchLog, User } = require('./models');

// Load environment variables
dotenv.config();

/**
 * 10 Real Varanasi District Hospitals with realistic coordinates,
 * capacity metrics, and Ayushman Bharat empanelment status.
 */
const varanasiHospitals = [
  {
    name: 'Sir Sundarlal Hospital (BHU)',
    locality: 'Lanka',
    district: 'Varanasi',
    lat: 25.2755,
    lng: 82.9995,
    totalBeds: 1500,
    availableBeds: 180,
    icuBeds: 180,
    availableIcuBeds: 15,
    oxygenStatus: 'adequate',
    ventilators: 100,
    ventilatorsAvailable: 12,
    ayushmanEmpanelled: true,
    lastUpdated: new Date(),
  },
  {
    name: 'Pt. Deendayal Upadhyay District Hospital',
    locality: 'Kabir Chaura',
    district: 'Varanasi',
    lat: 25.3176,
    lng: 83.0062,
    totalBeds: 350,
    availableBeds: 22,
    icuBeds: 40,
    availableIcuBeds: 3,
    oxygenStatus: 'adequate',
    ventilators: 25,
    ventilatorsAvailable: 2,
    ayushmanEmpanelled: true,
    lastUpdated: new Date(),
  },
  {
    name: 'ESIC Hospital',
    locality: 'Pandeypur',
    district: 'Varanasi',
    lat: 25.3458,
    lng: 82.9912,
    totalBeds: 150,
    availableBeds: 45,
    icuBeds: 20,
    availableIcuBeds: 6,
    oxygenStatus: 'adequate',
    ventilators: 12,
    ventilatorsAvailable: 4,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Ramnagar District Combined Hospital',
    locality: 'Ramnagar',
    district: 'Varanasi',
    lat: 25.2685,
    lng: 83.0298,
    totalBeds: 100,
    availableBeds: 8,
    icuBeds: 12,
    availableIcuBeds: 1,
    oxygenStatus: 'critical',
    ventilators: 6,
    ventilatorsAvailable: 0,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Shivpur CHC',
    locality: 'Shivpur',
    district: 'Varanasi',
    lat: 25.3621,
    lng: 82.9575,
    totalBeds: 50,
    availableBeds: 24,
    icuBeds: 8,
    availableIcuBeds: 4,
    oxygenStatus: 'adequate',
    ventilators: 4,
    ventilatorsAvailable: 3,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Banaras Medicity Heart & Multi-Super Speciality Hospital',
    locality: 'Mahmoorganj',
    district: 'Varanasi',
    lat: 25.3051,
    lng: 82.9810,
    totalBeds: 220,
    availableBeds: 65,
    icuBeds: 50,
    availableIcuBeds: 18,
    oxygenStatus: 'adequate',
    ventilators: 30,
    ventilatorsAvailable: 11,
    ayushmanEmpanelled: true,
    lastUpdated: new Date(),
  },
  {
    name: 'Galaxy Hospital',
    locality: 'Mahmoorganj',
    district: 'Varanasi',
    lat: 25.3090,
    lng: 82.9785,
    totalBeds: 120,
    availableBeds: 14,
    icuBeds: 25,
    availableIcuBeds: 2,
    oxygenStatus: 'low',
    ventilators: 15,
    ventilatorsAvailable: 1,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Varanasi Hospital',
    locality: 'Bhelupur',
    district: 'Varanasi',
    lat: 25.2980,
    lng: 82.9925,
    totalBeds: 80,
    availableBeds: 35,
    icuBeds: 15,
    availableIcuBeds: 7,
    oxygenStatus: 'adequate',
    ventilators: 8,
    ventilatorsAvailable: 4,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Marwari Hospital',
    locality: 'Varanasi',
    district: 'Varanasi',
    lat: 25.3115,
    lng: 83.0080,
    totalBeds: 90,
    availableBeds: 12,
    icuBeds: 10,
    availableIcuBeds: 2,
    oxygenStatus: 'adequate',
    ventilators: 6,
    ventilatorsAvailable: 1,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
  {
    name: 'Cantt/Railway Hospital',
    locality: 'Varanasi Cantt',
    district: 'Varanasi',
    lat: 25.3285,
    lng: 82.9750,
    totalBeds: 110,
    availableBeds: 40,
    icuBeds: 16,
    availableIcuBeds: 8,
    oxygenStatus: 'adequate',
    ventilators: 10,
    ventilatorsAvailable: 5,
    ayushmanEmpanelled: false,
    lastUpdated: new Date(),
  },
];

/**
 * 5 Sample Ambulances with realistic starting locations across Varanasi
 */
const sampleAmbulances = [
  {
    driverName: 'Ramesh Singh',
    vehicleId: 'UP-65-AM-101',
    currentLocation: { lat: 25.2800, lng: 82.9950 }, // Lanka Hub
    status: 'idle',
    assignedCase: null,
  },
  {
    driverName: 'Anil Yadav',
    vehicleId: 'UP-65-AM-202',
    currentLocation: { lat: 25.3300, lng: 82.9720 }, // Cantt Railway Station
    status: 'idle',
    assignedCase: null,
  },
  {
    driverName: 'Santosh Verma',
    vehicleId: 'UP-65-AM-303',
    currentLocation: { lat: 25.3095, lng: 83.0070 }, // Godowlia / Dashashwamedh
    status: 'idle',
    assignedCase: null,
  },
  {
    driverName: 'Mohd. Imran',
    vehicleId: 'UP-65-AM-404',
    currentLocation: { lat: 25.3460, lng: 82.9900 }, // Pandeypur Crossing
    status: 'idle',
    assignedCase: null,
  },
  {
    driverName: 'Deepak Mishra',
    vehicleId: 'UP-65-AM-505',
    currentLocation: { lat: 25.3080, lng: 82.9800 }, // Mahmoorganj Post
    status: 'idle',
    assignedCase: null,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing collections...');
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await Case.deleteMany({});
    await DispatchLog.deleteMany({});
    await User.deleteMany({});
    console.log('🧹 Cleaned existing Hospital, Ambulance, Case, DispatchLog, and User documents.');

    console.log('Inserting 10 Varanasi district hospitals...');
    const insertedHospitals = await Hospital.insertMany(varanasiHospitals);

    console.log('Inserting 5 Varanasi emergency ambulances...');
    const insertedAmbulances = await Ambulance.insertMany(sampleAmbulances);

    // Seed 3 Default Role Users (Day 25)
    console.log('Creating 3 sample users (districtAdmin, hospitalStaff, ambulanceDriver)...');
    const bhuHospital = insertedHospitals.find((h) => h.name.includes('BHU'));
    const ambulanceOne = insertedAmbulances[0];

    const sampleUsers = [
      {
        name: 'District Admin Officer',
        email: 'admin@meddispatch.varanasi.gov.in',
        password: 'Password@123',
        role: 'districtAdmin',
      },
      {
        name: 'Dr. Anand Verma (BHU Staff)',
        email: 'staff.bhu@meddispatch.varanasi.gov.in',
        password: 'Password@123',
        role: 'hospitalStaff',
        assignedHospital: bhuHospital ? bhuHospital._id : insertedHospitals[0]._id,
      },
      {
        name: 'Ramesh Singh (Driver)',
        email: 'driver1@meddispatch.varanasi.gov.in',
        password: 'Password@123',
        role: 'ambulanceDriver',
        assignedAmbulance: ambulanceOne ? ambulanceOne._id : insertedAmbulances[0]._id,
      },
    ];

    for (const userData of sampleUsers) {
      await User.create(userData);
    }
    console.log('✅ Seeded 3 default users with password: Password@123');

    // Seed 36 Simulated Historical Dispatch Logs (Day 23)
    console.log('Generating 36 historical dispatch logs for Analytics demo...');
    const sampleLogs = [];
    const now = Date.now();

    for (let i = 0; i < 36; i++) {
      const isPriority = i % 2 === 0;
      const hospital = insertedHospitals[i % insertedHospitals.length];
      const ambulance = insertedAmbulances[i % insertedAmbulances.length];

      const dispatchTime = new Date(now - (36 - i) * 65 * 60 * 1000);
      const waitTimeMinutes = isPriority
        ? Math.floor(9 + Math.random() * 8) // 9 to 16 mins
        : Math.floor(20 + Math.random() * 16); // 20 to 35 mins

      const arrivalTime = new Date(dispatchTime.getTime() + waitTimeMinutes * 60 * 1000);
      const treatmentStartTime = new Date(arrivalTime.getTime() + Math.floor(3 + Math.random() * 5) * 60 * 1000);

      sampleLogs.push({
        caseId: new mongoose.Types.ObjectId(),
        hospitalId: hospital._id,
        ambulanceId: ambulance._id,
        dispatchTime,
        arrivalTime,
        waitTimeMinutes,
        treatmentStartTime,
        method: isPriority ? 'priority' : 'FIFO',
      });
    }

    await DispatchLog.insertMany(sampleLogs);
    console.log(`✅ Seeded ${sampleLogs.length} historical DispatchLog entries.`);

    console.log('\n================ SEEDING VERIFICATION ================');
    console.log(`✅ Successfully seeded:`);
    console.log(`   - ${insertedHospitals.length} Hospitals`);
    console.log(`   - ${insertedAmbulances.length} Ambulances`);
    console.log(`   - 3 Users (admin, staff, driver)`);
    console.log(`   - ${sampleLogs.length} Dispatch Logs\n`);

    console.log('--- TEST USER CREDENTIALS ---');
    console.log('1. Admin:   admin@meddispatch.varanasi.gov.in   / Password@123');
    console.log('2. Staff:   staff.bhu@meddispatch.varanasi.gov.in / Password@123');
    console.log('3. Driver:  driver1@meddispatch.varanasi.gov.in / Password@123');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, varanasiHospitals, sampleAmbulances };

