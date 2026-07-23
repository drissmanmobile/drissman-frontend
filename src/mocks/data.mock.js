// src/mocks/schools.mock.js
export const mockSchools = [
  {
    id: '1',
    name: 'Auto-École Excellence',
    city: 'Yaoundé',
    address: '123 Avenue Kennedy, Bastos',
    description: 'Formation rapide et efficace au cœur de Yaoundé.',
    rating: 4.8,
    reviewCount: 124,
    phone: '+237 699 000 001',
    imageUrl: null,
    latitude: 3.8667,
    longitude: 11.5167,
    services: ['Permis B', 'Code de la route', 'Conduite accompagnée'],
    offers: [
      { id: 'o1', name: 'Pack Permis B Complet', description: '20h de conduite + code inclus', price: 250000, hours: 20 },
      { id: 'o2', name: 'Code de la Route Seul', description: 'Préparation intensive au code', price: 50000, hours: 0 },
    ],
  },
  {
    id: '2',
    name: 'Permis Days',
    city: 'Yaoundé',
    address: '75 Boulevard du 20 Mai, Melen',
    description: 'Votre permis en un temps record.',
    rating: 4.2,
    reviewCount: 87,
    phone: '+237 699 000 002',
    imageUrl: null,
    latitude: 3.8480,
    longitude: 11.5021,
    services: ['Permis B', 'Conduite accompagnée'],
    offers: [
      { id: 'o3', name: 'Pack Étudiant', description: '15h de conduite tarif réduit', price: 180000, hours: 15 },
    ],
  },
  {
    id: '3',
    name: 'Conduite Pro Douala',
    city: 'Douala',
    address: '45 Rue de la Joie, Akwa',
    description: 'Formation accélérée au cœur de Douala.',
    rating: 4.5,
    reviewCount: 95,
    phone: '+237 699 000 003',
    imageUrl: null,
    latitude: 4.0511,
    longitude: 9.7679,
    services: ['Permis B', 'Code de la route'],
    offers: [
      { id: 'o4', name: 'Formation Accélérée', description: '20h de conduite intensive', price: 350000, hours: 20 },
    ],
  },
  {
    id: '4',
    name: 'Safe Drive Bafoussam',
    city: 'Bafoussam',
    address: '12 Rue du Marché Central',
    description: 'Apprenez à conduire en toute sécurité.',
    rating: 4.0,
    reviewCount: 43,
    phone: '+237 699 000 004',
    imageUrl: null,
    latitude: 5.4764,
    longitude: 10.4214,
    services: ['Permis B'],
    offers: [
      { id: 'o5', name: 'Pack Standard', description: '20h de conduite', price: 200000, hours: 20 },
    ],
  },
]

export const mockEnrollments = [
  { id: 'e1', schoolName: 'Auto-École Excellence', offerName: 'Pack Permis B Complet', status: 'ACTIVE', startDate: '2025-01-10', sessionsCompleted: 8, totalSessions: 20 },
  { id: 'e2', schoolName: 'Permis Days', offerName: 'Code de la Route Seul', status: 'COMPLETED', startDate: '2024-11-01', sessionsCompleted: 10, totalSessions: 10 },
]

export const mockSessions = [
  { id: 's1', date: '2025-06-10T08:00:00', offerName: 'Pack Permis B Complet', schoolName: 'Auto-École Excellence', meetingPoint: 'Bastos – Carrefour Total', status: 'SCHEDULED' },
  { id: 's2', date: '2025-06-07T10:00:00', offerName: 'Pack Permis B Complet', schoolName: 'Auto-École Excellence', meetingPoint: 'Bastos – Carrefour Total', status: 'COMPLETED' },
  { id: 's3', date: '2025-05-28T09:00:00', offerName: 'Pack Permis B Complet', schoolName: 'Auto-École Excellence', meetingPoint: 'Bastos – Carrefour Total', status: 'CANCELLED' },
]

export const mockInstructors = [
  { id: 'i1', firstName: 'Jean', lastName: 'Fotso', phone: '+237 677 000 001', status: 'ACTIVE', sessionsThisMonth: 12 },
  { id: 'i2', firstName: 'Marie', lastName: 'Ngo', phone: '+237 677 000 002', status: 'ACTIVE', sessionsThisMonth: 9 },
]

export const mockMonitorStudents = [
  {
    id: 'st1',
    studentId: 'u1',
    studentName: 'Martin Paul',
    phone: '691 23 45 67',
    email: 'martinpaul@gmail.com',
    offerId: 'o1',
    offerName: 'Pack Permis B Complet',
    hoursPurchased: 20,
    hoursConsumed: 12,
    pendingLessons: 2,
    status: 'ACTIVE',
    progressPercent: 85,
    lessons: [
      { id: 'l1', date: '2025-05-19', time: '08:00 - 09:30', title: 'Conduite en ville', status: 'COMPLETED' },
      { id: 'l2', date: '2025-05-17', time: '10:00 - 11:30', title: 'Manœuvres', status: 'COMPLETED' },
      { id: 'l3', date: '2025-05-15', time: '13:00 - 14:30', title: 'Conduite sur route', status: 'COMPLETED' },
    ]
  },
  {
    id: 'st2',
    studentId: 'u2',
    studentName: 'Ngono Alice',
    phone: '675 34 56 78',
    email: 'ngonoalice@gmail.com',
    offerId: 'o1',
    offerName: 'Pack Permis B Complet',
    hoursPurchased: 20,
    hoursConsumed: 8,
    pendingLessons: 3,
    status: 'ACTIVE',
    progressPercent: 40,
    lessons: [
      { id: 'l4', date: '2025-05-20', time: '10:00 - 11:30', title: 'Manœuvres', status: 'SCHEDULED' },
      { id: 'l5', date: '2025-05-16', time: '08:00 - 09:30', title: 'Conduite en ville', status: 'COMPLETED' },
    ]
  },
  {
    id: 'st3',
    studentId: 'u3',
    studentName: 'Tchoua David',
    phone: '699 45 67 89',
    email: 'tchouadavid@gmail.com',
    offerId: 'o3',
    offerName: 'Pack Étudiant',
    hoursPurchased: 15,
    hoursConsumed: 15,
    pendingLessons: 0,
    status: 'ACTIVE',
    progressPercent: 100,
    lessons: [
      { id: 'l6', date: '2025-05-20', time: '13:00 - 14:30', title: 'Conduite sur route', status: 'IN_PROGRESS' },
    ]
  },
  {
    id: 'st4',
    studentId: 'u4',
    studentName: 'Bela Sarah',
    phone: '677 56 78 90',
    email: 'belasarah@gmail.com',
    offerId: 'o1',
    offerName: 'Pack Permis B Complet',
    hoursPurchased: 20,
    hoursConsumed: 10,
    pendingLessons: 4,
    status: 'ACTIVE',
    progressPercent: 50,
    lessons: [
      { id: 'l7', date: '2025-05-20', time: '15:00 - 16:30', title: 'Stationnement', status: 'SCHEDULED' },
    ]
  },
  {
    id: 'st5',
    studentId: 'u5',
    studentName: 'Ngo Yannick',
    phone: '695 67 89 01',
    email: 'ngoyannick@gmail.com',
    offerId: 'o4',
    offerName: 'Formation Accélérée',
    hoursPurchased: 20,
    hoursConsumed: 17,
    pendingLessons: 1,
    status: 'ACTIVE',
    progressPercent: 85,
    lessons: [
      { id: 'l8', date: '2025-05-20', time: '17:00 - 18:30', title: 'Évaluation finale', status: 'SCHEDULED' },
    ]
  },
  {
    id: 'st6',
    studentId: 'u6',
    studentName: 'Kamga Eric',
    phone: '678 78 90 12',
    email: 'kamgaeric@gmail.com',
    offerId: 'o3',
    offerName: 'Pack Étudiant',
    hoursPurchased: 15,
    hoursConsumed: 6,
    pendingLessons: 0,
    status: 'INACTIVE',
    progressPercent: 40,
    lessons: []
  },
]

export const mockInstructorScheduleSessions = [
  { id: 's101', date: '2025-05-20', startTime: '08:00:00', endTime: '09:30:00', studentName: 'Martin Paul', studentId: 'u1', offerName: 'Pack Permis B Complet', title: 'Conduite en ville', durationHours: 2, meetingPoint: 'Bastos - Carrefour Total', status: 'SCHEDULED' },
  { id: 's102', date: '2025-05-20', startTime: '10:00:00', endTime: '11:30:00', studentName: 'Ngono Alice', studentId: 'u2', offerName: 'Pack Permis B Complet', title: 'Manœuvres & Créneaux', durationHours: 2, meetingPoint: 'Poste Centrale - Place An 2000', status: 'SCHEDULED' },
  { id: 's103', date: '2025-05-20', startTime: '13:00:00', endTime: '14:30:00', studentName: 'Tchoua David', studentId: 'u3', offerName: 'Pack Étudiant', title: 'Conduite sur voie rapide', durationHours: 2, meetingPoint: 'Mvan - Total Garage', status: 'IN_PROGRESS' },
  { id: 's104', date: '2025-05-20', startTime: '15:00:00', endTime: '16:30:00', studentName: 'Bela Sarah', studentId: 'u4', offerName: 'Pack Permis B Complet', title: 'Stationnement & Marche arrière', durationHours: 2, meetingPoint: 'Bastos - Total', status: 'SCHEDULED' },
  { id: 's105', date: '2025-05-20', startTime: '17:00:00', endTime: '18:30:00', studentName: 'Ngo Yannick', studentId: 'u5', offerName: 'Formation Accélérée', title: 'Évaluation finale', durationHours: 2, meetingPoint: 'Agence Hippodrome', status: 'SCHEDULED' },
]

