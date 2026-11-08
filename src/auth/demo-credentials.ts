export const DEMO_ADMIN_EMAIL = "admin@example.com";

const DEMO_ONLY_DEFAULT_PASSWORD = "kebunku-demo-only";

export function getDemoAdminPassword(): string {
  return process.env.DEMO_ADMIN_PASSWORD ?? DEMO_ONLY_DEFAULT_PASSWORD;
}
