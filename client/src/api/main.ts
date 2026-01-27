import axios from "axios";

const apiUrl =
  import.meta.env.VITE_BASE_API_URL ||
  (() => {
    throw new Error("Api Url not found");
  })();

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});
