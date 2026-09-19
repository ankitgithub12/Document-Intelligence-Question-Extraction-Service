import api from './axios'

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export const getDocuments = (page = 1, pageSize = 20, status = null) => {
  const params = { page, page_size: pageSize }
  if (status) params.status = status
  return api.get('/documents', { params })
}

export const getDocument = (id) => api.get(`/documents/${id}`)

export const getDocumentStatus = (id) => api.get(`/documents/${id}/status`)

export const deleteDocument = (id) => api.delete(`/documents/${id}`)

export const createRelationship = (id, relatedId, type) =>
  api.post(`/documents/${id}/relationships`, {
    related_document_id: relatedId,
    relationship_type: type,
  })

export const getRelationships = (id) => api.get(`/documents/${id}/relationships`)
