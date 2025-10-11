import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // backend URL
  withCredentials: true, // send cookies if needed
});

export default api;
