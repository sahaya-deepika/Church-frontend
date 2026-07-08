import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true
});


export const apiGet = async (apiEndpoint, params = {}) => {
  try {
    const response = await api.get(apiEndpoint, { params });
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Something went wrong, please try again later.");
  }

}

export const apiPost = async (apiEndpoint, payload = {}, params = {}) => {
  try {
    const response = await api.post(apiEndpoint, payload);
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Something went wrong, please try again later.");
  }
}

export const apiPut = async (apiEndPoint, payload = {}, params = {}) => {
  try {
    const response = await api.put(apiEndPoint, payload); 
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Something went wrong, try again later");
  }
}

export const apiPatch = async (apiEndPoint, payload = {}, params = {}) => {
  try {
    const response = await api.patch(apiEndPoint, payload); 
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Something went wrong, try again later");
  }
}