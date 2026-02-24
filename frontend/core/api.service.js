const API_BASE = "http://192.168.179.18:5000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  getHeaders(includeAuth = true) {
    const headers = { "Content-Type": "application/json" };

    if (includeAuth) {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const { method = "GET", data = null, includeAuth = true, ...customConfig } = options;

    const config = {
      method,
      headers: this.getHeaders(includeAuth),
      ...customConfig,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const fullURL = `${this.baseURL}${endpoint}`;
    console.log('🔍 API Request:', method, fullURL);

    try {
      const response = await fetch(fullURL, config);

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          window.location.reload();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(responseData.message || "Request failed");
      }

      return responseData;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      data: { email, password },
      includeAuth: false,
    });
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      data: userData,
      includeAuth: false,
    });
  }


  // Admin endpoints
   async getUsers() {
    return this.request("/admin/users");
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  async getAttendance(params = {}) {
    // Build query string for month/year filters if provided
    const query = new URLSearchParams();
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    // Hits backend route: /admin/attendance
    return this.request(`/admin/attendance${queryString}`);
  }

  async exportAttendance(params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.status) query.append("status", params.status);

    return this.request(`/attendance/admin/export${query.toString() ? `?${query.toString()}` : ""}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  }

  async exportEmployees() {
    return this.request("/admin/users/export/csv", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  }

  async updateWorkingHours(data) {
    return this.request("/admin/settings/working-hours", {
      method: "PUT",
      data,
    });
  }

  async updatePolicies(data) {
    return this.request("/admin/settings/policies", {
      method: "PUT",
      data,
    });
  }

  async updateNotifications(data) {
    return this.request("/admin/settings/notifications", {
      method: "PUT",
      data,
    });
  }

  async getSettings() {
    return this.request("/admin/settings");
  }


  // User Attendance endpoints
  async markAttendance(data) {
    return this.request("/attendance/mark", {
      method: "POST",
      data,
    });
  }

  async getUserAttendance() {
    return this.request("/attendance/my-records");
  }

  async getTodayStatus() {
    return this.request("/attendance/today");
  }

  async checkIn(data) {
    return this.request("/attendance/check-in", {
      method: "POST",
      data,
    });
  }

  async checkOut(data) {
    return this.request("/attendance/check-out", {
      method: "POST",
      data,
    });
  }
}

// global instance
window.api = new ApiService();