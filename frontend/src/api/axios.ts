import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.1.18:3000",
  withCredentials: true,
});

export default instance;

// https://coloretto-api.onrender.com PARA DESPLIEGUE EN BASEURL
