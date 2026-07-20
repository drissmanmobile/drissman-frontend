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
