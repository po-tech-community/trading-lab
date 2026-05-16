const required = ["VITE_API_URL"] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
};
