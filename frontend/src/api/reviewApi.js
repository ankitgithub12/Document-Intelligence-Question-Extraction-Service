import api from './axios'

export const getReviewItems = (documentId, page = 1, pageSize = 50, resolved = null) => {
  const params = { page, page_size: pageSize }
  if (resolved !== null) params.resolved = resolved
  return api.get(`/documents/${documentId}/review-items`, { params })
}

export const getAllReviewItems = (documentId = null, page = 1, pageSize = 50, resolved = null) => {
  const params = { page, page_size: pageSize }
  if (documentId) params.document_id = documentId
  if (resolved !== null) params.resolved = resolved
  return api.get('/review-items', { params })
}

export const getReviewItem = (id) => api.get(`/review-items/${id}`)

export const resolveReviewItem = (id, resolved = true) =>
  api.patch(`/review-items/${id}/resolve`, null, { params: { resolved } })
