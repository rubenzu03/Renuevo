import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";
import { TEST_DATABASE_URL } from "./tests/db";

process.env.AUTH_SECRET = "test-auth-secret-0123456789abcdef";
process.env.APP_PASSWORD = "test-app-password";
process.env.CRON_SECRET = "test-cron-secret";
process.env.DATABASE_URL = TEST_DATABASE_URL;

vi.mock("next/image", () => ({
  default: (props: unknown) => {
    const { src, alt = "" } = props as { src: string; alt?: string };
    return React.createElement("span", {
      "data-testid": "next-image",
      "data-src": src,
      "data-alt": alt,
    });
  },
}));

afterEach(() => cleanup());