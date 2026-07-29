export type AppEnv = {
  API_PORT: number;
  NODE_ENV: string;
};

export function getEnv(): AppEnv {
  return {
    API_PORT: Number(process.env.API_PORT ?? 3001),
    NODE_ENV: process.env.NODE_ENV ?? "development"
  };
}

