import { beforeEach, describe, expect, it, vi } from "vitest";

const { createWorkerMock } = vi.hoisted(() => ({
  createWorkerMock: vi.fn(),
}));

vi.mock("tesseract.js", () => ({ createWorker: createWorkerMock }));

import {
  MockOcrEngine,
  TesseractOcrEngine,
  createOcrEngine,
  resetOcrWorkerForTests,
} from "./ocr";

beforeEach(() => {
  createWorkerMock.mockReset();
  resetOcrWorkerForTests();
  delete process.env.OCR_PROVIDER;
});

describe("MockOcrEngine", () => {
  it("returns its configured text", async () => {
    const engine = new MockOcrEngine("Total €29.00");
    expect(engine.id).toBe("mock");
    await expect(
      engine.extractText(new Uint8Array([1, 2, 3]), "receipt.png")
    ).resolves.toBe("Total €29.00");
  });
});

describe("TesseractOcrEngine", () => {
  it("recognizes text with a shared worker", async () => {
    const recognize = vi.fn(async () => ({ data: { text: "  Total €29.00\n" } }));
    createWorkerMock.mockResolvedValue({ recognize });
    const engine = new TesseractOcrEngine();

    await expect(
      engine.extractText(new Uint8Array([1, 2, 3]), "receipt.png")
    ).resolves.toBe("Total €29.00");
    await engine.extractText(new Uint8Array([4]), "other.jpg");
    expect(createWorkerMock).toHaveBeenCalledTimes(1);
    expect(recognize).toHaveBeenCalledTimes(2);
  });

  it("rejects unsupported image types", async () => {
    const engine = new TesseractOcrEngine();
    await expect(
      engine.extractText(new Uint8Array([1]), "receipt.pdf")
    ).rejects.toThrow("Unsupported receipt image type: pdf");
    expect(createWorkerMock).not.toHaveBeenCalled();
  });

  it("wraps recognition failures", async () => {
    createWorkerMock.mockRejectedValue(new Error("no wasm"));
    const engine = new TesseractOcrEngine();
    await expect(
      engine.extractText(new Uint8Array([1]), "receipt.png")
    ).rejects.toThrow("Receipt OCR failed");
  });
});

describe("createOcrEngine", () => {
  it("creates a mock engine by default", () => {
    const engine = createOcrEngine("hello");
    expect(engine.id).toBe("mock");
  });

  it("creates a tesseract engine when configured", () => {
    process.env.OCR_PROVIDER = "tesseract";
    expect(createOcrEngine().id).toBe("tesseract");
  });

  it("throws for unknown providers", () => {
    process.env.OCR_PROVIDER = "nope";
    expect(() => createOcrEngine()).toThrow("Unknown OCR provider: nope");
  });
});
