import { PrismaClient, UserRole, LabStatus, EquipmentCondition, EquipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = await hashPassword('admin123');
  const coordinatorPassword = await hashPassword('coord123');
  const researcherPassword = await hashPassword('researcher123');
  const technicianPassword = await hashPassword('technician123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cese-rlim.local' },
    update: {},
    create: {
      email: 'admin@cese-rlim.local',
      passwordHash: adminPassword,
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '+251911000001',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@cese-rlim.local' },
    update: {},
    create: {
      email: 'coordinator@cese-rlim.local',
      passwordHash: coordinatorPassword,
      firstName: 'Fatima',
      lastName: 'Ahmed',
      phone: '+251911000002',
      role: UserRole.COORDINATOR,
      isActive: true,
    },
  });

  const researcher1 = await prisma.user.upsert({
    where: { email: 'daniel.tesfaye@astu.edu.et' },
    update: {},
    create: {
      email: 'daniel.tesfaye@astu.edu.et',
      passwordHash: researcherPassword,
      firstName: 'Daniel',
      lastName: 'Tesfaye',
      phone: '+251911000003',
      role: UserRole.RESEARCHER,
      isActive: true,
    },
  });

  const researcher2 = await prisma.user.upsert({
    where: { email: 'hanna.bekele@astu.edu.et' },
    update: {},
    create: {
      email: 'hanna.bekele@astu.edu.et',
      passwordHash: researcherPassword,
      firstName: 'Hanna',
      lastName: 'Bekele',
      phone: '+251911000004',
      role: UserRole.RESEARCHER,
      isActive: true,
    },
  });

  const technician = await prisma.user.upsert({
    where: { email: 'technician@cese-rlim.local' },
    update: {},
    create: {
      email: 'technician@cese-rlim.local',
      passwordHash: technicianPassword,
      firstName: 'Yonas',
      lastName: 'Girma',
      phone: '+251911000005',
      role: UserRole.TECHNICIAN,
      isActive: true,
    },
  });

  console.log('Users created:', { admin, coordinator, researcher1, researcher2, technician });

  const researcherProfile1 = await prisma.researcher.upsert({
    where: { userId: researcher1.id },
    update: {},
    create: {
      userId: researcher1.id,
      employeeOrStudentId: 'ASTU-RES-001',
      department: 'Electrical Engineering',
      academicPosition: 'Assistant Professor',
      bio: 'Specialist in power systems and renewable energy research.',
      researchAreas: 'Power Systems, Renewable Energy, Smart Grids',
      expertise: 'Power electronics, Energy storage',
      orcid: '0000-0001-2345-6789',
    },
  });

  const researcherProfile2 = await prisma.researcher.upsert({
    where: { userId: researcher2.id },
    update: {},
    create: {
      userId: researcher2.id,
      employeeOrStudentId: 'ASTU-RES-002',
      department: 'Electronics Engineering',
      academicPosition: 'Lecturer',
      bio: 'Research focus on IoT systems and embedded electronics.',
      researchAreas: 'IoT, Embedded Systems, Sensors',
      expertise: 'Microcontrollers, Sensor networks, PCB design',
    },
  });

  console.log('Researcher profiles created');

  const lab1 = await prisma.laboratory.upsert({
    where: { code: 'ELEC-LAB' },
    update: {},
    create: {
      name: 'Electronics Laboratory',
      code: 'ELEC-LAB',
      location: 'Building A, Room 201',
      description: 'Fully equipped electronics lab for circuit design, testing, and prototyping.',
      capacity: 30,
      responsiblePersonId: coordinator.id,
      status: LabStatus.ACTIVE,
    },
  });

  const lab2 = await prisma.laboratory.upsert({
    where: { code: 'PWR-LAB' },
    update: {},
    create: {
      name: 'Power & Energy Laboratory',
      code: 'PWR-LAB',
      location: 'Building A, Room 305',
      description: 'Power systems analysis, renewable energy testing, and high-voltage experiments.',
      capacity: 20,
      responsiblePersonId: coordinator.id,
      status: LabStatus.ACTIVE,
    },
  });

  const lab3 = await prisma.laboratory.upsert({
    where: { code: 'IOT-LAB' },
    update: {},
    create: {
      name: 'IoT & Intelligent Systems Laboratory',
      code: 'IOT-LAB',
      location: 'Building B, Room 102',
      description: 'IoT prototyping, sensor integration, and intelligent systems development.',
      capacity: 25,
      responsiblePersonId: coordinator.id,
      status: LabStatus.ACTIVE,
    },
  });

  const lab4 = await prisma.laboratory.upsert({
    where: { code: 'CTL-LAB' },
    update: {},
    create: {
      name: 'Control & Automation Laboratory',
      code: 'CTL-LAB',
      location: 'Building B, Room 204',
      description: 'Control systems, automation, PLC programming, and robotics research.',
      capacity: 20,
      responsiblePersonId: coordinator.id,
      status: LabStatus.ACTIVE,
    },
  });

  console.log('Laboratories created:', { lab1, lab2, lab3, lab4 });

  const equipmentData = [
    { name: 'Digital Oscilloscope', assetId: 'ELEC-EQ-001', serialNumber: 'DSO-2024-001', category: 'Measurement', manufacturer: 'Tektronix', model: 'TBS1104C', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Power Analyzer', assetId: 'PWR-EQ-001', serialNumber: 'PA-2024-001', category: 'Measurement', manufacturer: 'Hioki', model: 'PW3335', laboratoryId: lab2.id, condition: EquipmentCondition.EXCELLENT, status: EquipmentStatus.AVAILABLE },
    { name: 'Signal Generator', assetId: 'ELEC-EQ-002', serialNumber: 'SG-2024-001', category: 'Signal', manufacturer: 'Rigol', model: 'DG1022Z', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Digital Multimeter', assetId: 'ELEC-EQ-003', serialNumber: 'DMM-2024-001', category: 'Measurement', manufacturer: 'Fluke', model: '87V', laboratoryId: lab1.id, condition: EquipmentCondition.EXCELLENT, status: EquipmentStatus.AVAILABLE },
    { name: 'DC Power Supply', assetId: 'ELEC-EQ-004', serialNumber: 'DCPS-2024-001', category: 'Power', manufacturer: 'Keysight', model: 'E36312A', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.IN_USE },
    { name: 'Function Generator', assetId: 'ELEC-EQ-005', serialNumber: 'FG-2024-001', category: 'Signal', manufacturer: 'Keysight', model: '33210A', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Logic Analyzer', assetId: 'ELEC-EQ-006', serialNumber: 'LA-2024-001', category: 'Digital', manufacturer: 'Saleae', model: 'Logic Pro 16', laboratoryId: lab3.id, condition: EquipmentCondition.EXCELLENT, status: EquipmentStatus.AVAILABLE },
    { name: 'Solar Panel Simulator', assetId: 'PWR-EQ-002', serialNumber: 'SPS-2024-001', category: 'Renewable Energy', manufacturer: 'Ametek', model: 'AST1000', laboratoryId: lab2.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'PLC Training Kit', assetId: 'CTL-EQ-001', serialNumber: 'PLC-2024-001', category: 'Automation', manufacturer: 'Siemens', model: 'S7-1200', laboratoryId: lab4.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Raspberry Pi 5 Kit', assetId: 'IOT-EQ-001', serialNumber: 'RP5-2024-001', category: 'Development Board', manufacturer: 'Raspberry Pi Foundation', model: 'Raspberry Pi 5', laboratoryId: lab3.id, condition: EquipmentCondition.EXCELLENT, status: EquipmentStatus.AVAILABLE },
    { name: 'Arduino Mega Kit', assetId: 'IOT-EQ-002', serialNumber: 'ARD-2024-001', category: 'Development Board', manufacturer: 'Arduino', model: 'Mega 2560', laboratoryId: lab3.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: '3D Printer', assetId: 'ELEC-EQ-007', serialNumber: '3DP-2024-001', category: 'Fabrication', manufacturer: 'Prusa', model: 'MK4', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Spectrum Analyzer', assetId: 'ELEC-EQ-008', serialNumber: 'SA-2024-001', category: 'Measurement', manufacturer: 'Rigol', model: 'DSA815', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
    { name: 'Network Analyzer', assetId: 'IOT-EQ-003', serialNumber: 'NA-2024-001', category: 'Network', manufacturer: 'Rohde & Schwarz', model: 'ZNB20', laboratoryId: lab3.id, condition: EquipmentCondition.EXCELLENT, status: EquipmentStatus.UNDER_MAINTENANCE },
    { name: 'Thermal Camera', assetId: 'ELEC-EQ-009', serialNumber: 'TC-2024-001', category: 'Imaging', manufacturer: 'FLIR', model: 'E8 Pro', laboratoryId: lab1.id, condition: EquipmentCondition.GOOD, status: EquipmentStatus.AVAILABLE },
  ];

  const equipmentRecords = [];
  for (const eq of equipmentData) {
    const record = await prisma.equipment.upsert({
      where: { assetId: eq.assetId },
      update: {},
      create: {
        ...eq,
        purchaseDate: new Date('2024-01-15'),
      },
    });
    equipmentRecords.push(record);
  }

  console.log(`Created ${equipmentRecords.length} equipment records`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
