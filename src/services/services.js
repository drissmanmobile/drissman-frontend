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

import { mockMonitorStudents, mockInstructorScheduleSessions } from '../mocks/data.mock'

export async function getInstructorSchedule(instructorId) {
  try {
    const res = await api.get('/api/monitors/me/sessions')
    if (res && res.length > 0) return res
    return mockInstructorScheduleSessions
  } catch (e) {
    return mockInstructorScheduleSessions
  }
}

export async function getMonitorStudents() {
  try {
    const res = await api.get('/api/monitors/me/students')
    if (res && Array.isArray(res)) {
      return res.map((item, idx) => ({
        id: item.enrollmentId || item.studentId || `st_${idx}`,
        studentId: item.studentId,
        studentName: item.studentName || 'Élève',
        phone: item.phone || '',
        email: item.email || '',
        offerId: item.offerId,
        offerName: item.offerName || 'Offre',
        hoursPurchased: item.hoursPurchased || 20,
        hoursConsumed: item.hoursConsumed || 0,
        pendingLessons: item.pendingLessons || 0,
        status: item.status === 'ACTIVE' || item.status === 'PENDING' ? 'ACTIVE' : 'INACTIVE',
        progressPercent: item.hoursPurchased > 0 ? Math.min(100, Math.round(((item.hoursConsumed || 0) / item.hoursPurchased) * 100)) : 0,
        lessons: item.lessons || [],
      }))
    }
    return []
  } catch (e) {
    console.error('Error fetching monitor students:', e)
    return []
  }
}

export async function getSessionStudents(sessionId, offerId = null, offerName = null) {
  try {
    const res = await api.get(`/api/monitors/me/sessions/${sessionId}/students`)
    if (Array.isArray(res) && res.length > 0) {
      return res.map((item, idx) => ({
        id: item.studentId || item.id || `st_${idx}`,
        studentId: item.studentId,
        studentName: item.studentName || 'Élève',
        offerId: item.offerId,
        offerName: item.offerName,
        phone: item.phone,
        email: item.email,
      }))
    }
  } catch (e) {
    console.log('Error fetching session students from backend:', e)
  }

  try {
    const allStudents = await getMonitorStudents()
    if (offerId || offerName) {
      const filtered = allStudents.filter(st => 
        (offerId && st.offerId === offerId) || 
        (offerName && st.offerName && st.offerName.toLowerCase().includes(offerName.toLowerCase()))
      )
      if (filtered.length > 0) return filtered
    }
    return allStudents.length > 0 ? allStudents : mockMonitorStudents
  } catch (e) {
    return mockMonitorStudents
  }
}

export async function validateSession(sessionId, present, attendanceMap = null) {
  try {
    const notes = attendanceMap ? JSON.stringify(attendanceMap) : (present ? 'Present' : 'Absent')
    return await api.patch(`/api/monitors/me/sessions/${sessionId}/complete?notes=${encodeURIComponent(notes)}`)
  } catch (e) {
    return { success: true, message: present ? 'Session terminée' : 'Absence enregistrée' }
  }
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

export async function updateAdminEnrollmentStatus(id, status) {
  return api.patch(`/api/schools/admin/enrollments/${id}/status`, { status })
}

export async function scheduleAdminSession(data) {
  return api.post('/api/schools/admin/sessions', data)
}

export async function getAdminModules() {
  return api.get('/api/modules')
}

export async function createAdminModule(data) {
  return api.post('/api/modules', data)
}

export async function updateAdminModule(id, data) {
  return api.put(`/api/modules/${id}`, data)
}

export async function deleteAdminModule(id) {
  return api.delete(`/api/modules/${id}`)
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
    return { ...doc, fileUrl: `${api.defaults.baseURL}${doc.fileUrl}` }
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
  return api.get('/api/documents/school')
}

export async function getMyDocuments() {
  return api.get('/api/documents/me')
}

export async function uploadDocument(fileUri, fileName, mimeType, uploaderId, moduleId, sessionId, schoolId, offerId, category = 'Administratif') {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType || 'application/pdf',
  });
  formData.append('category', category);

  const token = await SecureStore.getItemAsync('auth_token');
  
  return fetch(`${api.defaults.baseURL}/api/documents`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  })
  .then(res => resolveFileUrl(res));
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
  
  return fetch(`${api.defaults.baseURL}/api/images/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(res => {
    const relativeUrl = res.url || res.fileUrl;
    return { ...res, fileUrl: relativeUrl?.startsWith('/') ? `${api.defaults.baseURL}${relativeUrl}` : relativeUrl };
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

// Chat & Messagerie
export async function getChatContacts() {
  return api.get('/api/chat/contacts')
}

export async function getChatMessages(partnerId) {
  return api.get(`/api/chat/messages/${partnerId}`)
}

export async function sendChatMessage(recipientId, content, offerId = null) {
  return api.post('/api/chat/messages', { recipientId, content, offerId })
}

export async function markChatRead(partnerId) {
  return api.put(`/api/chat/messages/${partnerId}/read`)
}

