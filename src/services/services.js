// src/services/services.js
import api from './api'
import * as SecureStore from 'expo-secure-store'

export async function getSchools(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  return api.get(`/api/schools?${params}`)
}

export async function getNearbySchools(lat, lng, radius = 10) {
  return api.get(`/api/schools/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
}

export async function getSchoolById(id) {
  return api.get(`/api/schools/${id}`)
}

// Sessions
export async function getStudentSessions(studentId) {
  return api.get('/api/enrollments/me/sessions')
}

export async function getInstructorSchedule(instructorId) {
  return api.get('/api/monitors/me/sessions')
}

export async function validateSession(sessionId, present) {
  return api.patch(`/api/monitors/me/sessions/${sessionId}/complete?notes=${present ? 'Present' : 'Absent'}`)
}

// Enrollments
export async function getStudentEnrollments(studentId) {
  return api.get('/api/enrollments/me')
}

export async function createEnrollment(data) {
  return api.post('/api/enrollments', data)
}

// Instructors
export async function getSchoolInstructors(schoolId) {
  return api.get(`/api/schools/${schoolId}/monitors`)
}

// Admin
export async function getAdminDashboard() {
  return api.get('/api/schools/admin/dashboard')
}

export async function getAdminSchoolProfile() {
  return api.get('/api/schools/admin/profile')
}

export async function updateAdminSchoolProfile(data) {
  return api.patch('/api/schools/admin', data)
}

export async function getAdminOffers() {
  return api.get('/api/schools/admin/offers')
}

export async function createAdminOffer(data) {
  return api.post('/api/schools/admin/offers', data)
}

export async function updateAdminOffer(id, data) {
  return api.patch(`/api/schools/admin/offers/${id}`, data)
}

export async function deleteAdminOffer(id) {
  return api.delete(`/api/schools/admin/offers/${id}`)
}

export async function getAdminMonitors() {
  return api.get('/api/schools/admin/monitors')
}

export async function createAdminMonitor(data) {
  return api.post('/api/schools/admin/monitors', data)
}

export async function updateAdminMonitor(id, data) {
  return api.patch(`/api/schools/admin/monitors/${id}`, data)
}

export async function deleteAdminMonitor(id) {
  return api.delete(`/api/schools/admin/monitors/${id}`)
}

export async function getAdminAvailableOffers(date) {
  return api.get(`/api/schools/admin/sessions/available-offers?date=${date}`)
}

export async function getAdminAvailableEnrollments(offerId, date) {
  return api.get(`/api/schools/admin/sessions/available-enrollments?offerId=${offerId}&date=${date}`)
}

export async function getAdminEnrollments() {
  return api.get('/api/schools/admin/enrollments')
}

export async function scheduleAdminSession(data) {
  return api.post('/api/schools/admin/sessions', data)
}

export async function getAdminModules() {
  return api.get('/api/modules')
}

// Vehicles
export async function getAdminVehicles() {
  return api.get('/api/schools/admin/vehicles')
}

export async function createAdminVehicle(data) {
  return api.post('/api/schools/admin/vehicles', data)
}

export async function updateAdminVehicle(id, data) {
  return api.patch(`/api/schools/admin/vehicles/${id}`, data)
}

export async function deleteAdminVehicle(id) {
  return api.delete(`/api/schools/admin/vehicles/${id}`)
}

// Documents
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'

const resolveFileUrl = (doc) => {
  if (doc && doc.fileUrl && doc.fileUrl.startsWith('/')) {
    return { ...doc, fileUrl: `${BASE_URL}${doc.fileUrl}` }
  }
  return doc
}

export async function getSessionDocuments(sessionId) {
  return [] // En suspens
}

export async function getModuleDocuments(moduleId) {
  return [] // En suspens
}

export async function getSchoolDocuments(schoolId) {
  return [] // En suspens
}

export async function uploadDocument(fileUri, fileName, mimeType, uploaderId, moduleId, sessionId, schoolId, offerId) {
  // En suspens, on retourne un mock URL temporairement
  return { id: Math.random().toString(), name: fileName, fileUrl: 'https://example.com/mock-file.pdf' }
}

// Images (Avatar)
export async function uploadImage(fileUri) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  });

  const token = await SecureStore.getItemAsync('auth_token');
  
  return fetch(`${BASE_URL}/api/images/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(res => {
    const relativeUrl = res.url || res.fileUrl;
    return { ...res, fileUrl: relativeUrl?.startsWith('/') ? `${BASE_URL}${relativeUrl}` : relativeUrl };
  });
}

// Paiements
export async function getMyPayments() {
  return api.get('/api/payments/me')
}

export async function initiatePayment(data) {
  return api.post('/api/payments/initiate', data)
}

export async function refreshPayment(invoiceId) {
  return api.get(`/api/payments/${invoiceId}/refresh`)
}
