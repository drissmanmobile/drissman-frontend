// src/utils/formatPrice.js
export function formatPrice(amount) {
  if (!amount && amount !== 0) return '—'
  const formatted = new Intl.NumberFormat('fr-FR').format(amount)
  return `${formatted} FCFA`
}

// src/utils/formatDate.js
export function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
