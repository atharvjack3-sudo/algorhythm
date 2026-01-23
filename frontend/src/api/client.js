// /src/api/client.js

import axios from "axios";

export const api = axios.create({
  baseURL: "https://algorhythm-6zhv.onrender.com/api",
  withCredentials: true,
});
