// lib/api/client-fetch.ts

// Define the expected structure for errors coming from our Route Handlers
// (Matching the ErrorResponse defined in server-fetch.ts)
export interface ApiError {
message: string;
status: number;
details?: any;
}

/**
* Fetches the list of users from the internal API route.
  */
  export async function fetchUserList<T = any>(): Promise<T> { // Generic type T
  const response = await fetch('/api/users'); // Call internal GET /api/users

  if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw {
  message: errorData.message || `HTTP error! status: ${response.status}`,
  status: errorData.status || response.status,
  details: errorData.details
  } as ApiError; // Type assertion
  }
  if (response.status === 204) return [] as T; // Handle no content, return empty array
  return await response.json();
  }

/**
* Creates a new post by calling the internal API route.
* @param postData The data for the new post.
  */
  export async function createPost<T = any, D = any>(postData: D): Promise<T> { // Generic types T (response), D (data)
  const response = await fetch('/api/posts', { // Call internal POST /api/posts
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(postData)
  });

  if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw {
  message: errorData.message || `HTTP error! status: ${response.status}`,
  status: errorData.status || response.status,
  details: errorData.details
  } as ApiError;
  }
  if (response.status === 204) return {} as T; // Handle no content if applicable
  return await response.json(); // Expecting JSON response (e.g., { id: string })
  }

// You could add fetchSingleUser here too for consistency
export async function fetchSingleUser<T = any>(userId: string): Promise<T | null> { // Return null if 204?
if (!userId) throw new Error("User ID is required."); // Basic validation

    const internalApiUrl = `/api/users/${encodeURIComponent(userId)}`;
    const response = await fetch(internalApiUrl);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
         throw {
            message: errorData.message || `HTTP error! status: ${response.status}`,
            status: errorData.status || response.status,
            details: errorData.details
        } as ApiError;
    }

    if (response.status === 204) {
        return null; // Explicitly return null for No Content / Not Found
    }
    return await response.json();
}

// File: app/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
// Import the specific fetch function and error type
import { fetchUserList, ApiError } from "@/lib/api/client-fetch"; // Adjust path

// User type definition
interface User {
id: string;
name: string;
email: string;
}

export default function UsersPage() {
// State management using useState
const [users, setUsers] = useState<User[] | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
const [error, setError] = useState<ApiError | null>(null);

    // Define the function to fetch data using useCallback for stability
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Clear previous error
        // setUsers(null); // Optionally clear previous data immediately
        try {
            const data = await fetchUserList<User[]>(); // Call the helper function
            setUsers(data);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
            setError(err as ApiError); // Set the structured error
            setUsers(null); // Ensure data is cleared on error
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this function doesn't change

    // Fetch users when component mounts
    useEffect(() => {
        loadUsers();
    }, [loadUsers]); // Depend on the memoized loadUsers function

    // Render loading state
    if (isLoading && users === null) { // Show initial loading indicator
        return <div className="p-4">Loading users...</div>;
    }

    // Render error state
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded">
                <h2 className="font-bold">Error loading users</h2>
                {/* Display message from the structured error */}
                <p>{error.message || "An unknown error occurred."}</p>
                {/* Optionally display details if available */}
                {error.details && (
                     <pre className="mt-2 text-sm bg-red-100 p-2 rounded overflow-x-auto">
                        <code>{JSON.stringify(error.details, null, 2)}</code>
                     </pre>
                )}
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={loadUsers} // Call loadUsers directly to retry
                    disabled={isLoading} // Disable button while loading
                >
                    {isLoading ? "Loading..." : "Try Again"}
                </button>
            </div>
        );
    }

    // Render data or no data found state
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Users</h1>
            {/* Optional: Button to refresh */}
            <button
                 className="mb-4 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                 onClick={loadUsers}
                 disabled={isLoading}
            >
                {isLoading ? "Refreshing..." : "Refresh List"}
            </button>

            {/* Display user list or 'No users found' message */}
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
                // Check if not loading to differentiate between initial load and empty list
                !isLoading && <p>No users found.</p>
            )}
        </div>
    );
}

// File: app/posts/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Import the specific fetch function and error type
import { createPost, ApiError } from "@/lib/api/client-fetch"; // Adjust path

// Input data structure
interface PostData {
title: string;
content: string;
}

// Expected response structure after successful post creation
interface PostResponse {
id: string;
// Include other fields if your API returns them
}

export default function CreatePostPage() {
const router = useRouter();
const [form, setForm] = useState<PostData>({
title: "",
content: "",
});
// State for loading and error feedback
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<ApiError | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null); // Clear previous error

        try {
            // Call the helper function to POST data
            const result = await createPost<PostResponse, PostData>(form);

            console.log("Post created successfully:", result);
            // Use optional chaining for safety
            if (result?.id) {
                router.push(`/posts/${result.id}`); // Navigate on success if ID exists
            } else {
                 // Handle cases where ID might not be returned or navigation isn't desired
                 console.warn("Post created, but ID not found in response or navigation skipped.");
                 // Maybe redirect to a list page or show a success message
                 router.push('/posts'); // Example: redirect to posts list
            }

        } catch (err: any) {
            console.error("Failed to create post:", err);
            setError(err as ApiError); // Set the structured error object
        } finally {
            setIsLoading(false); // Ensure loading state is reset
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Create New Post</h1>

            {/* Display error message if present */}
            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded">
                    <p className="font-bold">Error creating post</p>
                    {/* Display message from the structured error */}
                    <p>{error.message || "An unknown error occurred."}</p>
                     {/* Optionally display details */}
                     {error.details && (
                        <pre className="mt-2 text-sm bg-red-100 p-2 rounded overflow-x-auto">
                            <code>{JSON.stringify(error.details, null, 2)}</code>
                        </pre>
                     )}
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
                        disabled={isLoading} // Disable input while loading
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
                        disabled={isLoading} // Disable input while loading
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading} // Disable button while loading
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
