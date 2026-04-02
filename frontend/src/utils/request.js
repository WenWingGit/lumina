const BASE_URL = '/api';
const AUTH_TOKEN = 'my_secure_token_2026';

export async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `请求失败: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getGoals(status) {
    const query = status ? `?status=${status}` : '';
    return request(`/goals${query}`);
  },
  
  createGoal(data) {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  updateGoal(id, data) {
    return request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  deleteGoal(id) {
    return request(`/goals/${id}`, {
      method: 'DELETE'
    });
  },
  
  getRecords(goalId) {
    return request(`/goals/${goalId}/records`);
  },
  
  createRecord(data) {
    return request('/records', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  deleteRecord(id) {
    return request(`/records/${id}`, {
      method: 'DELETE'
    });
  },
  
  getMilestones(goalId) {
    return request(`/goals/${goalId}/milestones`);
  },
  
  exportData() {
    return request('/export');
  }
};
