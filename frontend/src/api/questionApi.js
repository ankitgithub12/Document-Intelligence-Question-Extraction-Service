import api from './axios'

export const getQuestions = (documentId, page = 1, pageSize = 50, filters = {}) => {
  const params = { page, page_size: pageSize, ...filters }
  return api.get(`/documents/${documentId}/questions`, { params })
}

export const getQuestion = (id) => api.get(`/questions/${id}`)

export const getAnswer = (questionId) => api.get(`/questions/${questionId}/answer`)

export const getAnswers = (documentId) => api.get(`/documents/${documentId}/answers`)
