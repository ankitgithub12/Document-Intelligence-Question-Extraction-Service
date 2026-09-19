import api from './axios'

export const getReviewItems = (documentId, page = 1, pageSize = 50) =>
  api.get(`/documents/${documentId}/review-items`, { params: { page, page_size: pageSize } })

export const getReviewItem = (id) => api.get(`/review-items/${id}`)
