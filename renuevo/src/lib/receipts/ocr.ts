import { createWorker, type Worker } from "tesseract.js";

export interface ReceiptOcrEngine {
  readonly id: string;
  extractText(image: Uint8Array, filename: string): Promise<string>;
}

export class MockOcrEngine implements ReceiptOcrEngine {
  readonly id = "mock";
  constructor(private readonly text = "") {}
  async extractText(_image: Uint8Array, _filename: string): Promise<string> {
    return this.text;
  }
}

const SUPPORTED_IMAGE_TYPES = new Set([
  "png",
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "bmp",
  "webp",
]);

let workerPromise: Promise<Worker> | null = null;

async function sharedWorker(languages: string): Promise<Worker> {
  workerPromise ??= createWorker(languages);
  return workerPromise;
}

export function resetOcrWorkerForTests(): void {
  workerPromise = null;
}

export class TesseractOcrEngine implements ReceiptOcrEngine {
  readonly id = "tesseract";
  constructor(private readonly languages = "eng") {}

  async extractText(image: Uint8Array, filename: string): Promise<string> {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_IMAGE_TYPES.has(ext)) {
      throw new Error(`Unsupported receipt image type: ${ext || "unknown"}`);
    }
    try {
      const worker = await sharedWorker(this.languages);
      const { data } = await worker.recognize(Buffer.from(image));
      return data.text.trim();
    } catch {
      workerPromise = null;
      throw new Error("Receipt OCR failed: set OCR_PROVIDER=mock to skip OCR");
    }
  }
}

export function createOcrEngine(textOverride?: string): ReceiptOcrEngine {
  const provider = process.env.OCR_PROVIDER ?? "mock";
  switch (provider) {
    case "tesseract":
      return new TesseractOcrEngine(process.env.OCR_LANGUAGES ?? "eng");
    case "mock":
      return new MockOcrEngine(textOverride ?? process.env.OCR_MOCK_TEXT ?? "");
    default:
      throw new Error(`Unknown OCR provider: ${provider}`);
  }
}
