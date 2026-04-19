import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("Attaching Token:", token);
    
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = 'Bearer ' + token;
    } else if (!config.url.startsWith('/auth')) {
      window.location.href = '/login';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
