import axios from 'axios';
import { client as orderClient } from '../client/orders.swagger';
import { client as productClient } from '../client/products.swagger';
import { client as userClient } from '../client/users.swagger';
import { deleteData, readData } from './storage';
import { router } from 'expo-router';

userClient.setConfig({
  // set default base url for requests
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
});

orderClient.setConfig({
  // set default base url for requests
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
});

productClient.setConfig({
  // set default base url for requests
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
});

userClient.instance.interceptors.response.use(
  response => response, // Directly return successful responses.
  async error => handleResponseError(error),
);

orderClient.instance.interceptors.response.use(
  response => response, // Directly return successful responses.
  async error => handleResponseError(error),
);

productClient.instance.interceptors.response.use(
  response => response, // Directly return successful responses.
  async error => handleResponseError(error),
);

const updateAuthHeader = (newToken: string) => {
  userClient.setConfig({
    // set default headers for requests
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  orderClient.setConfig({
    // set default headers for requests
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  productClient.setConfig({
    // set default headers for requests
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponseError = async (error: any) => {
  const originalRequest = error?.config;

  if (
    error?.response?.status === 401 &&
    !originalRequest?._retry &&
    (!!error?.response?.data?.message || !!error?.response?.data) &&
    (error?.response?.data?.message ?? error?.response?.data ?? '').includes(
      'ID token has expired',
    )
  ) {
    originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
    try {
      const refreshToken = await readData('@refreshToken'); // Retrieve the stored refresh token.
      // Make a request to your auth server to refresh the token.
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/public/users/refresh-access-token`,
        {
          refreshToken,
        },
      );

      const { accessToken } = response?.data;

      updateAuthHeader(accessToken);

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
      console.error('Token refresh failed:', refreshError);
      await deleteData('@refreshToken');

      router.replace('/(auth)/login');
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error); // For all other errors, return the error as is.
};

export { updateAuthHeader };
