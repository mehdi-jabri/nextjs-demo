// lib/api/axios-server.ts (New or modified file)
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

// Define API base URLs using server-only env vars
export const API_URLS = {
main: process.env.MAIN_API_URL || "https://api.example.com",
analytics: process.env.ANALYTICS_API_URL || "https://analytics-api.example.com",
users: process.env.USERS_API_URL || "https://users-api.example.com",
};

export type ApiKey = keyof typeof API_URLS;

// Factory function to create instances (can now optionally accept headers per call)
export const createServerAxiosInstance = (baseURL: string): AxiosInstance => {
const instance = axios.create({
baseURL,
timeout: 15000, // Adjust as needed
headers: {
"Content-Type": "application/json",
// Add other static headers if needed, e.g., a server-side API key
// 'X-Server-API-Key': process.env.SOME_STATIC_SERVER_KEY
},
});

// Optional: Simplified interceptor for server-side logging/error handling
instance.interceptors.response.use(
(response) => response,
(error: AxiosError) => {
console.error(
`[SERVER AXIOS ERROR] Request to ${error.config?.baseURL}${error.config?.url} failed:`,
error.response?.status,
error.message
);
// Don't attempt client-side refresh logic here
return Promise.reject(error);
}
);

return instance;
};

// Create instances for each API
// These instances are primarily for setting the baseURL. Auth is added per-request.
export const serverApiInstances: Record<ApiKey, AxiosInstance> = {
main: createServerAxiosInstance(API_URLS.main),
analytics: createServerAxiosInstance(API_URLS.analytics),
users: createServerAxiosInstance(API_URLS.users),
};

// Function to get a server API instance by key
export const getServerApiInstance = (key: ApiKey = "main"): AxiosInstance => {
return serverApiInstances[key];
};

// Helper function to make authenticated server requests
// It gets the instance and injects the Authorization header if a token is provided
export const makeServerApiRequest = async (
apiKey: ApiKey,
config: AxiosRequestConfig,
accessToken?: string | null // Pass token explicitly
): Promise<any> => { // Consider using a more specific return type if possible
const instance = getServerApiInstance(apiKey);
const headers = { ...config.headers };

if (accessToken) {
headers.Authorization = `Bearer ${accessToken}`;
}

try {
const response = await instance({ ...config, headers });
return response.data;
} catch (error) {
// Error is already logged by the interceptor
// Re-throw or handle specificially if needed, maybe transform error structure
throw error; // Let the Route Handler manage the final response
}
};

// app/api/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth config
import { makeServerApiRequest } from '@/lib/api/axios-server'; // Adjust path
import { AxiosError } from 'axios';

export async function GET(request: NextRequest) {
const session = await auth(); // Get session server-side

if (!session?.access_token) {
return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

try {
// Forward the request to the actual Users API
const usersData = await makeServerApiRequest(
'users', // The key for the users API instance/URL
{ method: 'GET', url: '/users' }, // The specific endpoint on the Users API
session.access_token
);
return NextResponse.json(usersData);

} catch (error) {
const axiosError = error as AxiosError;
const status = axiosError.response?.status || 500;
const message = axiosError.response?.data || axiosError.message || 'Failed to fetch users';
console.error("[API Route Error - GET /api/users]:", status, message);
return NextResponse.json({ message }, { status });
}
}



// app/api/posts/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth'; // Adjust path
import { makeServerApiRequest } from '@/lib/api/axios-server'; // Adjust path
import { AxiosError } from 'axios';

export async function POST(request: NextRequest) {
const session = await auth();

if (!session?.access_token) {
return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

try {
const body = await request.json(); // Get body from client request

    // Make POST request to the actual Main API
    const postResponse = await makeServerApiRequest(
      'main', // The key for the main API instance/URL
      { method: 'POST', url: '/posts', data: body }, // Endpoint and data
      session.access_token
    );
    return NextResponse.json(postResponse);

} catch (error) {
const axiosError = error as AxiosError;
const status = axiosError.response?.status || 500;
const message = axiosError.response?.data || axiosError.message || 'Failed to create post';
console.error("[API Route Error - POST /api/posts]:", status, message);
return NextResponse.json({ message }, { status });
}
}

// app/api/analytics/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth'; // Adjust path
import { makeServerApiRequest } from '@/lib/api/axios-server'; // Adjust path
import { AxiosError } from 'axios';

export async function GET(request: NextRequest) {
const session = await auth();

if (!session?.access_token) {
return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

try {
// Make GET request to the actual Analytics API
const analyticsData = await makeServerApiRequest(
'analytics', // The key for the analytics API instance/URL
{ method: 'GET', url: '/dashboard' }, // The specific endpoint
session.access_token
);
return NextResponse.json(analyticsData);

} catch (error) {
const axiosError = error as AxiosError;
const status = axiosError.response?.status || 500;
const message = axiosError.response?.data || axiosError.message || 'Failed to fetch analytics';
console.error("[API Route Error - GET /api/analytics]:", status, message);
return NextResponse.json({ message }, { status });
}
}

// File: lib/api/hooks/useInternalApi.ts (New or renamed/refactored file)
import { useState, useCallback } from "react";
import { AxiosRequestConfig } from "axios"; // Keep for config familiarity if desired

// Note: We removed ApiKey and direct Axios instance usage from the hook options

export interface ApiError {
message: string;
status?: number;
data?: any; // Data from the error response body
}

export interface ApiState<T> {
data: T | null;
isLoading: boolean;
error: ApiError | null;
}

// Generic fetch wrapper function (could be moved to a utils file)
async function internalFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
const response = await fetch(url, {
headers: {
'Content-Type': 'application/json',
...options.headers,
},
...options,
});

    const responseData = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty obj if fails

    if (!response.ok) {
        const error: ApiError = {
            message: responseData?.message || response.statusText || "An error occurred",
            status: response.status,
            data: responseData,
        };
        throw error;
    }

    return responseData as T;
}


// Hook for GET requests to internal API routes
export function useInternalApiGet<T = any>(internalUrl: string, options?: { initialData?: T, onSuccess?: (data: T) => void; onError?: (error: ApiError) => void; onFinally?: () => void; }) {
const [state, setState] = useState<ApiState<T>>({
data: options?.initialData || null,
isLoading: false,
error: null,
});

// Note: config is now RequestInit (fetch options) not AxiosRequestConfig
const fetchData = useCallback(
async (config?: RequestInit) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));
try {
// Call the internal Next.js route handler
const result = await internalFetch<T>(internalUrl, { method: 'GET', ...config });
setState((prev) => ({ ...prev, data: result, isLoading: false }));
options?.onSuccess?.(result);
return result;
} catch (err) {
const apiError = err as ApiError;
setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
options?.onError?.(apiError);
throw apiError; // Re-throw if needed for component logic
} finally {
options?.onFinally?.();
}
},
[internalUrl, options] // Dependencies
);

return {
...state,
fetch: fetchData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Hook for POST requests to internal API routes
export function useInternalApiPost<T = any, D = any>(internalUrl: string, options?: { onSuccess?: (data: T) => void; onError?: (error: ApiError) => void; onFinally?: () => void; }) {
const [state, setState] = useState<ApiState<T>>({
data: null,
isLoading: false,
error: null,
});

// Note: config is now RequestInit (fetch options) not AxiosRequestConfig
const postData = useCallback(
async (data: D, config?: Omit<RequestInit, 'body' | 'method'>) => { // Exclude body/method from config
setState((prev) => ({ ...prev, isLoading: true, error: null }));
try {
const result = await internalFetch<T>(internalUrl, {
method: 'POST',
body: JSON.stringify(data),
...config,
});
setState((prev) => ({ ...prev, data: result, isLoading: false }));
options?.onSuccess?.(result);
return result;
} catch (err) {
const apiError = err as ApiError;
setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
options?.onError?.(apiError);
throw apiError;
} finally {
options?.onFinally?.();
}
},
[internalUrl, options]
);

return {
...state,
submit: postData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Implement useInternalApiPut, useInternalApiDelete similarly if needed, using fetch with PUT/DELETE methods

// File: app/users/page.tsx
"use client";

import { useEffect } from "react";
// Import the new hook
import { useInternalApiGet } from "@/lib/api/hooks/useInternalApi"; // Adjust path

// User type definition
interface User {
id: string;
name: string;
email: string;
}

export default function UsersPage() {
// Call the internal /api/users route
const {
data: users,
isLoading,
error,
fetch: fetchUsers
} = useInternalApiGet<User[]>("/api/users", { // <-- Use internal route
// No apiKey needed here
onError: (err) => {
console.error("Failed to fetch users:", err);
}
});

useEffect(() => {
fetchUsers();
}, [fetchUsers]);

// ... rest of the component remains the same (JSX for loading, error, data)
// ... (render logic as before)

if (isLoading) {
return <div className="p-4">Loading users...</div>;
}

if (error) {
return (
<div className="p-4 bg-red-50 text-red-700 rounded">
<h2 className="font-bold">Error loading users</h2>
{/* Display error message from the API route response */}
<p>{error.data?.message || error.message}</p>
<button
className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
onClick={() => fetchUsers()}
>
Try Again
</button>
</div>
);
}

return (
<div className="p-4">
<h1 className="text-2xl font-bold mb-4">Users</h1>

      {users && users.length > 0 ? (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="p-3 border rounded shadow-sm">
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
);
}

// File: app/posts/create/page.tsx
"use client";

import { useState } from "react";
// Import the new hook
import { useInternalApiPost } from "@/lib/api/hooks/useInternalApi"; // Adjust path
import { useRouter } from "next/navigation";

interface PostData {
title: string;
content: string;
}

// Expected response structure from POST /api/posts
interface PostResponse {
id: string;
// ... other fields returned by your API
}


export default function CreatePostPage() {
const router = useRouter();
const [form, setForm] = useState<PostData>({
title: "",
content: "",
});

// Call the internal /api/posts route
const {
submit: createPost,
isLoading,
error
} = useInternalApiPost<PostResponse, PostData>("/api/posts", { // <-- Use internal route
// No apiKey needed here
onSuccess: (data) => {
console.log("Post created successfully:", data);
if (data?.id) {
router.push(`/posts/${data.id}`); // Navigate on success
} else {
console.warn("Create post response did not contain an ID. Staying on page.");
// Optionally show a success message without redirecting
}
},
onError: (err) => {
console.error("Error creating post:", err)
// Error message is displayed below
}
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
const { name, value } = e.target;
setForm((prev) => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
try {
await createPost(form);
// Success handling (redirect) is now in the onSuccess callback
} catch (submissionError) {
// Error is already handled by the hook's onError and state update
// No need to do much here unless you want specific submit-failure logic
console.log("Submission failed (error handled by hook).")
}
};

// ... rest of the component remains the same (JSX for form, error display)
// ... (render logic as before)

return (
<div className="p-4 max-w-2xl mx-auto">
<h1 className="text-2xl font-bold mb-4">Create New Post</h1>

      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded">
          <p className="font-bold">Error creating post</p>
           {/* Display error message from the API route response */}
          <p>{error.data?.message || error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-1 font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            rows={6}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
);
}

// File: app/analytics/page.tsx
"use client";

import { useEffect } from "react";
// Import the new hook
import { useInternalApiGet } from "@/lib/api/hooks/useInternalApi"; // Adjust path

interface AnalyticsData {
pageViews: number;
uniqueVisitors: number;
averageTimeOnSite: string;
topReferrers: Array<{ source: string; count: number }>;
}

export default function AnalyticsPage() {
// Call the internal /api/analytics route
const {
data,
isLoading,
error,
fetch: fetchAnalytics
} = useInternalApiGet<AnalyticsData>("/api/analytics", { // <-- Use internal route
// No apiKey needed here
onError: (err) => {
console.error("Failed to fetch analytics:", err);
}
});

useEffect(() => {
fetchAnalytics();
}, [fetchAnalytics]);

// ... rest of the component remains the same (JSX for loading, error, data)
// ... (render logic as before)
// ...
}

// File: lib/api/axios-instance.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getSession } from "next-auth/react";

// Define API base URLs
export const API_URLS = {
main: process.env.NEXT_PUBLIC_API_URL || "https://api.example.com",
analytics: process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "https://analytics-api.example.com",
users: process.env.NEXT_PUBLIC_USERS_API_URL || "https://users-api.example.com",
};

// Type for API keys
export type ApiKey = keyof typeof API_URLS;

// Create axios instances for each API
export const createAxiosInstance = (baseURL: string): AxiosInstance => {
const instance = axios.create({
baseURL,
timeout: 15000,
headers: {
"Content-Type": "application/json",
},
});

// Request interceptor to add auth token
instance.interceptors.request.use(
async (config) => {
try {
// Get session using next-auth v5
const session = await getSession();

        // If session exists and has an access token, add it to the headers
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return config;
      } catch (error) {
        console.error("Error in request interceptor:", error);
        return Promise.reject(error);
      }
    },
    (error) => {
      return Promise.reject(error);
    }
);

// Response interceptor for error handling
instance.interceptors.response.use(
(response) => response,
async (error: AxiosError) => {
const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // If the error is 401 Unauthorized and we haven't already tried to refresh the token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // You can implement token refresh logic here using next-auth
          // Example:
          // await refreshToken();
          // const newSession = await getSession();
          // if (newSession?.access_token) {
          //   originalRequest.headers = originalRequest.headers || {};
          //   originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`;
          //   return axios(originalRequest);
          // }
        } catch (refreshError) {
          // Handle refresh token failure
          // You might want to redirect to login page or clear session
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
);

return instance;
};

// Create instances for each API
export const apiInstances: Record<ApiKey, AxiosInstance> = {
main: createAxiosInstance(API_URLS.main),
analytics: createAxiosInstance(API_URLS.analytics),
users: createAxiosInstance(API_URLS.users),
};

// Export a function to get an API instance by key
export const getApiInstance = (key: ApiKey = "main"): AxiosInstance => {
return apiInstances[key];
};

// File: lib/api/hooks/useApi.ts
import { useState, useCallback } from "react";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getApiInstance, ApiKey } from "../axios-instance";

interface UseApiOptions {
apiKey?: ApiKey;
onSuccess?: (data: any) => void;
onError?: (error: ApiError) => void;
onFinally?: () => void;
}

export interface ApiError {
message: string;
status?: number;
data?: any;
}

export interface ApiState<T> {
data: T | null;
isLoading: boolean;
error: ApiError | null;
}

// Hook for GET requests
export function useApiGet<T = any>(url: string, options?: UseApiOptions & { initialData?: T }) {
const [state, setState] = useState<ApiState<T>>({
data: options?.initialData || null,
isLoading: false,
error: null,
});

const fetchData = useCallback(
async (config?: AxiosRequestConfig) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const apiInstance = getApiInstance(options?.apiKey);
        const response: AxiosResponse<T> = await apiInstance.get(url, config);
        
        setState((prev) => ({ ...prev, data: response.data, isLoading: false }));
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError;
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
          data: error.response?.data,
        };
        
        setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        options?.onError?.(apiError);
        throw apiError;
      } finally {
        options?.onFinally?.();
      }
    },
    [url, options]
);

return {
...state,
fetch: fetchData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Hook for POST requests
export function useApiPost<T = any, D = any>(url: string, options?: UseApiOptions) {
const [state, setState] = useState<ApiState<T>>({
data: null,
isLoading: false,
error: null,
});

const postData = useCallback(
async (data: D, config?: AxiosRequestConfig) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const apiInstance = getApiInstance(options?.apiKey);
        const response: AxiosResponse<T> = await apiInstance.post(url, data, config);
        
        setState((prev) => ({ ...prev, data: response.data, isLoading: false }));
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError;
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
          data: error.response?.data,
        };
        
        setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        options?.onError?.(apiError);
        throw apiError;
      } finally {
        options?.onFinally?.();
      }
    },
    [url, options]
);

return {
...state,
submit: postData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Hook for PUT requests
export function useApiPut<T = any, D = any>(url: string, options?: UseApiOptions) {
const [state, setState] = useState<ApiState<T>>({
data: null,
isLoading: false,
error: null,
});

const putData = useCallback(
async (data: D, config?: AxiosRequestConfig) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const apiInstance = getApiInstance(options?.apiKey);
        const response: AxiosResponse<T> = await apiInstance.put(url, data, config);
        
        setState((prev) => ({ ...prev, data: response.data, isLoading: false }));
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError;
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
          data: error.response?.data,
        };
        
        setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        options?.onError?.(apiError);
        throw apiError;
      } finally {
        options?.onFinally?.();
      }
    },
    [url, options]
);

return {
...state,
submit: putData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Hook for DELETE requests
export function useApiDelete<T = any>(url: string, options?: UseApiOptions) {
const [state, setState] = useState<ApiState<T>>({
data: null,
isLoading: false,
error: null,
});

const deleteData = useCallback(
async (config?: AxiosRequestConfig) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const apiInstance = getApiInstance(options?.apiKey);
        const response: AxiosResponse<T> = await apiInstance.delete(url, config);
        
        setState((prev) => ({ ...prev, data: response.data, isLoading: false }));
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError;
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
          data: error.response?.data,
        };
        
        setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        options?.onError?.(apiError);
        throw apiError;
      } finally {
        options?.onFinally?.();
      }
    },
    [url, options]
);

return {
...state,
submit: deleteData,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// Universal hook for any request type
export function useApiRequest<T = any, D = any>(options?: UseApiOptions) {
const [state, setState] = useState<ApiState<T>>({
data: null,
isLoading: false,
error: null,
});

const request = useCallback(
async (config: AxiosRequestConfig & { data?: D }) => {
setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const apiInstance = getApiInstance(options?.apiKey);
        const response: AxiosResponse<T> = await apiInstance(config);
        
        setState((prev) => ({ ...prev, data: response.data, isLoading: false }));
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError;
        const apiError: ApiError = {
          message: error.message || "An error occurred",
          status: error.response?.status,
          data: error.response?.data,
        };
        
        setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        options?.onError?.(apiError);
        throw apiError;
      } finally {
        options?.onFinally?.();
      }
    },
    [options]
);

return {
...state,
request,
reset: () => setState({ data: null, isLoading: false, error: null }),
};
}

// File: types/next-auth.d.ts
import { DefaultSession } from "next-auth";

// Extend the session types to include access_token
declare module "next-auth" {
interface Session {
access_token?: string;
expires_at?: number;
user: DefaultSession["user"] & {
id?: string;
// Add any additional user properties you need
};
}
}

// You can extend other types as needed
declare module "next-auth/jwt" {
interface JWT {
access_token?: string;
expires_at?: number;
refresh_token?: string;
}
}

// File: app/users/page.tsx
"use client";

import { useEffect } from "react";
import { useApiGet } from "@/lib/api/hooks/useApi";

// User type definition
interface User {
id: string;
name: string;
email: string;
}

export default function UsersPage() {
// Using the users API to fetch users
const {
data: users,
isLoading,
error,
fetch: fetchUsers
} = useApiGet<User[]>("/users", {
apiKey: "users", // Use the users API instance
onError: (err) => {
console.error("Failed to fetch users:", err);
}
});

useEffect(() => {
// Fetch users when component mounts
fetchUsers();
}, [fetchUsers]);

if (isLoading) {
return <div className="p-4">Loading users...</div>;
}

if (error) {
return (
<div className="p-4 bg-red-50 text-red-700 rounded">
<h2 className="font-bold">Error loading users</h2>
<p>{error.message}</p>
<button
className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
onClick={() => fetchUsers()}
>
Try Again
</button>
</div>
);
}

return (
<div className="p-4">
<h1 className="text-2xl font-bold mb-4">Users</h1>

      {users && users.length > 0 ? (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="p-3 border rounded shadow-sm">
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
);
}

// File: app/posts/create/page.tsx
"use client";

import { useState } from "react";
import { useApiPost } from "@/lib/api/hooks/useApi";
import { useRouter } from "next/navigation";

interface PostData {
title: string;
content: string;
}

export default function CreatePostPage() {
const router = useRouter();
const [form, setForm] = useState<PostData>({
title: "",
content: "",
});

// Using the main API to create a post
const {
submit: createPost,
isLoading,
error
} = useApiPost<{ id: string }, PostData>("/posts", {
apiKey: "main", // Use the main API instance
onSuccess: (data) => {
// Navigate to the post detail page on success
router.push(`/posts/${data.id}`);
}
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
const { name, value } = e.target;
setForm((prev) => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
await createPost(form);
};

return (
<div className="p-4 max-w-2xl mx-auto">
<h1 className="text-2xl font-bold mb-4">Create New Post</h1>

      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded">
          <p className="font-bold">Error creating post</p>
          <p>{error.message}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block mb-1 font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            rows={6}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
);
}

// File: app/analytics/page.tsx
"use client";

import { useEffect } from "react";
import { useApiGet } from "@/lib/api/hooks/useApi";

interface AnalyticsData {
pageViews: number;
uniqueVisitors: number;
averageTimeOnSite: string;
topReferrers: Array<{ source: string; count: number }>;
}

export default function AnalyticsPage() {
// Using the analytics API to fetch analytics data
const {
data,
isLoading,
error,
fetch: fetchAnalytics
} = useApiGet<AnalyticsData>("/dashboard", {
apiKey: "analytics" // Use the analytics API instance
});

useEffect(() => {
fetchAnalytics();
}, [fetchAnalytics]);

if (isLoading) {
return <div className="p-4">Loading analytics data...</div>;
}

if (error) {
return (
<div className="p-4 bg-red-50 text-red-700 rounded">
<h2 className="font-bold">Error loading analytics</h2>
<p>{error.message}</p>
<button
className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
onClick={() => fetchAnalytics()}
>
Refresh Data
</button>
</div>
);
}

return (
<div className="p-4">
<h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded shadow-sm">
            <h2 className="font-semibold text-lg">Page Views</h2>
            <p className="text-3xl font-bold mt-2">{data.pageViews.toLocaleString()}</p>
          </div>
          
          <div className="p-4 border rounded shadow-sm">
            <h2 className="font-semibold text-lg">Unique Visitors</h2>
            <p className="text-3xl font-bold mt-2">{data.uniqueVisitors.toLocaleString()}</p>
          </div>
          
          <div className="p-4 border rounded shadow-sm">
            <h2 className="font-semibold text-lg">Avg. Time on Site</h2>
            <p className="text-3xl font-bold mt-2">{data.averageTimeOnSite}</p>
          </div>
          
          <div className="p-4 border rounded shadow-sm">
            <h2 className="font-semibold text-lg">Top Referrers</h2>
            <ul className="mt-2 space-y-1">
              {data.topReferrers.map((ref, index) => (
                <li key={index} className="flex justify-between">
                  <span>{ref.source}</span>
                  <span className="font-medium">{ref.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
);
}

// File: app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Configure NextAuth
export const authConfig: NextAuthConfig = {
providers: [
CredentialsProvider({
name: "Credentials",
credentials: {
email: { label: "Email", type: "email" },
password: { label: "Password", type: "password" }
},
async authorize(credentials) {
if (!credentials?.email || !credentials?.password) {
return null;
}

        try {
          // Replace with your actual API call to authenticate
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || "Authentication failed");
          }
          
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            // Store tokens in the JWT, not directly in the user object
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
    // Add other providers as needed (Google, GitHub, etc.)
],
callbacks: {
async jwt({ token, user }) {
// Initial sign in
if (user) {
token.access_token = user.access_token;
token.refresh_token = user.refresh_token;
token.id = user.id;

        // Calculate token expiration (example: 1 hour from now)
        const expiresAt = Date.now() + 60 * 60 * 1000;
        token.expires_at = expiresAt;
      }
      
      // Return previous token if the access token has not expired
      if (token.expires_at && Date.now() < token.expires_at) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.access_token = token.access_token;
        session.expires_at = token.expires_at;
        
        if (token.id) {
          session.user.id = token.id as string;
        }
      }
      
      return session;
    },
},
pages: {
signIn: "/auth/signin",
error: "/auth/error",
},
session: {
strategy: "jwt",
maxAge: 60 * 60, // 1 hour
},
debug: process.env.NODE_ENV === "development",
};

/**
* Refresh the access token using the refresh token
  */
  async function refreshAccessToken(token: any) {
  try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  },
  body: JSON.stringify({
  refresh_token: token.refresh_token,
  }),
  });

  const refreshedTokens = await response.json();

  if (!response.ok) {
  throw refreshedTokens;
  }

  return {
  ...token,
  access_token: refreshedTokens.access_token,
  refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
  expires_at: Date.now() + 60 * 60 * 1000, // 1 hour
  };
  } catch (error) {
  console.error("Error refreshing access token:", error);

  // The refresh token has expired or is invalid
  return {
  ...token,
  error: "RefreshAccessTokenError",
  };
  }
  }

// Create the handler
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// File: middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Configure the paths that require authentication
const protectedPaths = [
"/dashboard",
"/profile",
"/users",
"/analytics",
"/posts/create",
];

// Paths that should redirect authenticated users to dashboard
const authPaths = ["/login", "/register", "/auth/signin"];

export async function middleware(request: NextRequest) {
const { pathname } = request.nextUrl;

// Check if the path requires authentication
const requiresAuth = protectedPaths.some((path) =>
pathname.startsWith(path)
);

// Check if the path is an auth path
const isAuthPath = authPaths.some((path) =>
pathname === path
);

// Get the user's token (will be null if not authenticated)
const token = await getToken({
req: request,
secret: process.env.NEXTAUTH_SECRET,
});

// Redirect unauthenticated users from protected pages to login
if (requiresAuth && !token) {
const redirectUrl = new URL("/auth/signin", request.url);
redirectUrl.searchParams.set("callbackUrl", encodeURI(request.url));
return NextResponse.redirect(redirectUrl);
}

// Redirect authenticated users from auth pages to dashboard
if (isAuthPath && token) {
return NextResponse.redirect(new URL("/dashboard", request.url));
}

// Check for token errors that might require a new login
if (token?.error === "RefreshAccessTokenError") {
// Clear the session and redirect to login
return NextResponse.redirect(new URL("/auth/signin?error=token", request.url));
}

return NextResponse.next();
}

// Configure the paths that the middleware should run on
export const config = {
matcher: [
/*
     * Match all request paths except for:
     * - API routes (which should handle their own authentication)
     * - Static files (assets, images, favicons, etc)
     * - _next/ internal routes
*/
"/((?!api|_next/static|_next/image|favicon.ico|public).*)",
],
};

// File: components/ui/ErrorDisplay.tsx
import React from "react";
import { ApiError } from "@/lib/api/hooks/useApi";

interface ErrorDisplayProps {
error: ApiError | null;
onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
if (!error) return null;



// lib/axiosInstances.ts (or src/lib/axiosInstances.ts)
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
// Use getSession from 'next-auth/react' for client-side fetching
import { getSession } from 'next-auth/react';

// --- Helper Function to Add Auth Token ---
// This interceptor function needs to be async to await getSession()
const authInterceptor = async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
// getSession() is suitable here as interceptors run client-side
// for requests originating from the browser.
const session = await getSession(); // Fetch the current session client-side

// Note: Ensure your session callback in auth.config.ts adds the accessToken
const accessToken = (session as any)?.accessToken; // Use type assertion or extend Session type

if (accessToken) {
if (!config.headers) {
config.headers = {};
}
config.headers.Authorization = `Bearer ${accessToken}`;
console.log('Interceptor added Bearer token.'); // For debugging
} else {
console.warn('No access token found in session for Axios request.'); // For debugging
}
// Set default headers if needed
config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
config.headers['Accept'] = config.headers['Accept'] || 'application/json';

return config;
};

// --- Error Handling Interceptor (Optional but Recommended) ---
const errorInterceptor = (error: any) => {
// Handle specific errors globally if needed (e.g., 401 Unauthorized redirects)
if (error.response?.status === 401) {
console.error("Unauthorized request - potential token expiry or invalid token.");
// Optionally redirect to login or trigger token refresh logic if needed
// signOut(); // Or trigger a custom refresh flow
}
// Always reject the promise to propagate the error
return Promise.reject(error);
};


// --- Create Axios Instances ---

// Instance for API 1
const apiClient1: AxiosInstance = axios.create({
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL_1,
timeout: 10000, // 10 seconds timeout
});

// Instance for API 2
const apiClient2: AxiosInstance = axios.create({
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL_2,
timeout: 15000, // 15 seconds timeout
});

// --- Apply Interceptors ---
// Apply the request interceptor to add the token before the request is sent
apiClient1.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
apiClient2.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

// Apply the response interceptor for error handling
apiClient1.interceptors.response.use(response => response, errorInterceptor);
apiClient2.interceptors.response.use(response => response, errorInterceptor);


// --- Export Instances ---
export { apiClient1, apiClient2 };

// --- Type Helper for API Calls (Optional but good practice) ---
export interface ApiCallOptions {
method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
url: string;
data?: any; // Body data for POST, PUT, PATCH
params?: any; // URL query parameters
headers?: Record<string, string>;
// Add other Axios config options if needed
}


// hooks/useApi.ts (or src/hooks/useApi.ts)
"use client"; // This hook is for client components

import { useState, useCallback } from 'react';
import { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiCallOptions } from '@/lib/axiosInstances'; // Adjust path if needed

// Define the state structure for the hook
interface ApiState<T> {
data: T | null;
loading: boolean;
error: AxiosError | Error | null; // Can be AxiosError or general Error
}

// Define the return type of the hook
interface UseApiReturn<T> extends ApiState<T> {
execute: (options: Omit<ApiCallOptions, 'url'> & { url?: string }) => Promise<void>;
}

// The custom hook
// Accepts the Axios instance and optionally a default URL part
function useApi<T = any>( // T is the expected data type in the response
apiClient: AxiosInstance,
defaultUrl: string = '' // Optional default URL path segment
): UseApiReturn<T> {
const [state, setState] = useState<ApiState<T>>({
data: null,
loading: false,
error: null,
});

// Use useCallback to memoize the execute function
const execute = useCallback(async (options: Omit<ApiCallOptions, 'url'> & { url?: string }) => {
setState((prevState) => ({
...prevState,
loading: true,
error: null,
// Optionally clear previous data, or keep it until new data arrives
// data: null,
}));

    const requestUrl = options.url ?? defaultUrl;
    if (!requestUrl) {
        console.error("No URL provided for API call.");
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: new Error("API URL is required."),
        }));
        return;
    }

    try {
      const response: AxiosResponse<T> = await apiClient.request({
        url: requestUrl,
        method: options.method || 'GET', // Default to GET
        data: options.data,
        params: options.params,
        headers: options.headers,
        // Add any other specific Axios config needed from options
      });

      setState({
        data: response.data,
        loading: false,
        error: null,
      });
       console.log('API call successful:', response.data); // Debugging

    } catch (err: any) {
      console.error('API call failed:', err); // Debugging
      const apiError: AxiosError | Error = err as AxiosError | Error;
      setState({
        data: null, // Clear data on error
        loading: false,
        error: apiError, // Store the error object
      });
    }
}, [apiClient, defaultUrl]); // Dependencies for useCallback

return {
...state,
execute,
};
}

export default useApi;


// app/dashboard/page.tsx (or any other client component)
"use client"; // Required for hooks like useState, useEffect, useSession, useApi

import React, { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import useApi from '@/hooks/useApi'; // Adjust path
import { apiClient1, apiClient2 } from '@/lib/axiosInstances'; // Adjust path

// Example type for API data
interface UserProfile {
id: string;
name: string;
email: string;
}

interface Product {
productId: number;
productName: string;
price: number;
}

export default function DashboardPage() {
// Get session status and data
const { data: session, status } = useSession();

// Setup API hooks for different endpoints/APIs
const {
data: profileData,
loading: profileLoading,
error: profileError,
execute: fetchProfile,
} = useApi<UserProfile>(apiClient1); // Using API client 1

const {
data: productsData,
loading: productsLoading,
error: productsError,
execute: fetchProducts,
} = useApi<Product[]>(apiClient2); // Using API client 2

// Fetch data when the component mounts and session is available
useEffect(() => {
if (status === 'authenticated') {
console.log('Authenticated, fetching data...');
// Fetch profile from API 1
fetchProfile({ url: '/users/me' }); // Example endpoint

      // Fetch products from API 2
      fetchProducts({ url: '/products', params: { category: 'electronics' } }); // Example endpoint with params
    } else if (status === 'unauthenticated') {
      console.log('Not authenticated.');
      // Optional: Redirect to sign-in or show login prompt
      // signIn('microsoft-entra-id');
    }
}, [status, fetchProfile, fetchProducts]); // Add fetch functions to dependencies

// Handle loading state for the session
if (status === 'loading') {
return <p>Loading session...</p>;
}

// Handle unauthenticated state
if (status === 'unauthenticated') {
return (
<div>
<p>Access Denied. Please sign in.</p>
<button onClick={() => signIn('microsoft-entra-id')}>Sign In with Microsoft</button>
</div>
);
}

// --- Render component content ---
return (
<div>
<h1>Dashboard</h1>
<p>Welcome, {session?.user?.name ?? 'User'}!</p>
{/* Uncomment to see session details (including token if configured) */}
{/* <pre>{JSON.stringify(session, null, 2)}</pre> */}

      <hr />

      {/* Section for Profile Data (API 1) */}
      <h2>My Profile (from API 1)</h2>
      {profileLoading && <p>Loading profile...</p>}
      {profileError && (
        <p style={{ color: 'red' }}>
          Error loading profile: {profileError.message}
          {/* Optionally display more details from AxiosError */}
          {(profileError as any).response?.data?.message && ` - ${(profileError as any).response.data.message}`}
        </p>
      )}
      {profileData && (
        <div>
          <p>Name: {profileData.name}</p>
          <p>Email: {profileData.email}</p>
        </div>
      )}
      {/* Button to re-fetch profile */}
      <button onClick={() => fetchProfile({ url: '/users/me' })} disabled={profileLoading}>
        Reload Profile
      </button>

      <hr />

      {/* Section for Products Data (API 2) */}
      <h2>Products (from API 2)</h2>
      {productsLoading && <p>Loading products...</p>}
      {productsError && (
         <p style={{ color: 'red' }}>Error loading products: {productsError.message}</p>
      )}
      {productsData && productsData.length > 0 && (
        <ul>
          {productsData.map((product) => (
            <li key={product.productId}>
              {product.productName} - ${product.price.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
      {productsData && productsData.length === 0 && !productsLoading && (
         <p>No products found.</p>
      )}
       {/* Button to re-fetch products */}
      <button onClick={() => fetchProducts({ url: '/products', params: { category: 'electronics' } })} disabled={productsLoading}>
        Reload Products
      </button>

    </div>
);
}
