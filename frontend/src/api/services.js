import api from './axios';

const get = (url, params, signal) => api.get(url, { params, signal }).then((r) => r.data);

// ---------- Categories (backend returns plain arrays / objects here) ----------
export const categoryApi = {
  list: (type, signal) => get('/categories', type ? { type } : undefined, signal),
  create: (data) => api.post('/categories', data).then((r) => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

// ---------- Recipes ----------
export const recipeApi = {
  list: (params, signal) => get('/recipes', params, signal),            // { count, recipes }
  get: (id, signal) => get(`/recipes/${id}`, undefined, signal),         // { recipe }
  adminList: (params, signal) => get('/recipes/admin', params, signal),  // { total, page, pages, count, recipes }
  adminGet: (id, signal) => get(`/recipes/admin/${id}`, undefined, signal),
  create: (formData) => api.post('/recipes', formData).then((r) => r.data),
  update: (id, formData) => api.put(`/recipes/${id}`, formData).then((r) => r.data),
  remove: (id) => api.delete(`/recipes/${id}`).then((r) => r.data),
};

// ---------- Workouts ----------
export const workoutApi = {
  list: (params, signal) => get('/workouts', params, signal),
  get: (id, signal) => get(`/workouts/${id}`, undefined, signal),
  adminList: (params, signal) => get('/workouts/admin', params, signal),
  adminGet: (id, signal) => get(`/workouts/admin/${id}`, undefined, signal),
  create: (formData) => api.post('/workouts', formData).then((r) => r.data),
  update: (id, formData) => api.put(`/workouts/${id}`, formData).then((r) => r.data),
  remove: (id) => api.delete(`/workouts/${id}`).then((r) => r.data),
};

// ---------- Programs ----------
export const programApi = {
  list: (params, signal) => get('/programs', params, signal),            // { count, programs } (no days)
  get: (id, signal) => get(`/programs/${id}`, undefined, signal),         // { program } with populated days
  adminList: (params, signal) => get('/programs/admin', params, signal),
  adminGet: (id, signal) => get(`/programs/admin/${id}`, undefined, signal),
  create: (formData) => api.post('/programs', formData).then((r) => r.data),
  update: (id, formData) => api.put(`/programs/${id}`, formData).then((r) => r.data),
  remove: (id) => api.delete(`/programs/${id}`).then((r) => r.data),
};

// ---------- Enrollments ----------
export const enrollmentApi = {
  list: (status, signal) => get('/enrollments', status ? { status } : undefined, signal),
  get: (id, signal) => get(`/enrollments/${id}`, undefined, signal),
  enroll: (programId) => api.post('/enrollments', { programId }).then((r) => r.data),
  completeDay: (id, dayNumber) => api.put(`/enrollments/${id}/complete-day`, { dayNumber }).then((r) => r.data),
  abandon: (id) => api.put(`/enrollments/${id}/abandon`).then((r) => r.data),
};

// ---------- Daily logs ----------
export const logApi = {
  range: (from, to, signal) => get('/daily-logs', { from, to }, signal), // { count, logs }
  get: (date, signal) => get(`/daily-logs/${date}`, undefined, signal),   // { log } or 404
  create: (data) => api.post('/daily-logs', data).then((r) => r.data),
  update: (date, data) => api.put(`/daily-logs/${date}`, data).then((r) => r.data),
};

// ---------- Favorites ----------
export const favoriteApi = {
  list: (type, signal) => get('/favorites', type ? { type } : undefined, signal),
  add: (itemType, itemId) => api.post('/favorites', { itemType, itemId }).then((r) => r.data),
  remove: (itemType, itemId) => api.delete(`/favorites/${itemType}/${itemId}`).then((r) => r.data),
};

// ---------- User ----------
export const userApi = {
  onboarding: (data) => api.put('/users/onboarding', data).then((r) => r.data),
};

/** Build multipart FormData. Arrays/objects are JSON-stringified (the backend JSON.parses them). */
export function toFormData(values, file) {
  const fd = new FormData();
  Object.entries(values).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (typeof val === 'object') fd.append(key, JSON.stringify(val));
    else fd.append(key, String(val));
  });
  if (file) fd.append('image', file);
  return fd;
}
