import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { config } from "../../config/env.js";
import { logger } from "../logger/logger.js";

export type StoredImage = {
  /** Opaque handle persisted on the row. Only this layer knows how to resolve it. */
  storageKey: string;
  mimeType: string;
};

export type StoredImageContent = {
  body: Buffer;
  mimeType: string;
};

/**
 * The seam between "we generated an image" and "the bytes live somewhere".
 *
 * Deliberately a port rather than direct `fs` calls in the service: the deployment
 * target for this project is not settled, and a filesystem is the one backend that
 * is wrong on ephemeral hosts (a deploy wipes the disk and every cached mockup
 * silently 404s). Keeping the contract this narrow — put/get/delete over an opaque
 * key — means switching to S3/R2 later is a new adapter plus one line in the
 * factory, with no service, DTO, route, or schema change.
 */
export interface MockupStorage {
  put(input: { body: Buffer; mimeType: string }): Promise<StoredImage>;
  get(storageKey: string): Promise<StoredImageContent | null>;
  delete(storageKey: string): Promise<void>;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

/**
 * Filesystem-backed adapter. Keys are relative POSIX-ish paths ("ab/cd/<uuid>.png")
 * fanned out over two levels so a busy portal never lands tens of thousands of
 * files in one directory.
 */
export class FilesystemMockupStorage implements MockupStorage {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = resolve(rootDir);
  }

  /**
   * Resolves a key inside the root and refuses anything that escapes it. The keys
   * this class mints are always safe, but `get` is reachable from a public route
   * with a client-supplied id, so a traversal guard belongs here rather than
   * relying on every caller to validate first.
   */
  private resolveKey(storageKey: string): string | null {
    const candidate = resolve(join(this.rootDir, normalize(storageKey)));

    if (candidate !== this.rootDir && !candidate.startsWith(this.rootDir + sep)) {
      logger.warn(`Rejected out-of-root mockup storage key: ${storageKey}`);
      return null;
    }

    return candidate;
  }

  async put({ body, mimeType }: { body: Buffer; mimeType: string }): Promise<StoredImage> {
    const extension = MIME_EXTENSIONS[mimeType] ?? "png";
    const id = randomUUID();
    // Fan out on a hash of the id rather than the id's own first chars so the
    // distribution stays even regardless of how the UUID version allocates bits.
    const digest = createHash("sha256").update(id).digest("hex");
    const storageKey = `${digest.slice(0, 2)}/${digest.slice(2, 4)}/${id}.${extension}`;

    const absolutePath = this.resolveKey(storageKey);
    if (!absolutePath) {
      throw new Error("Failed to resolve a safe storage path");
    }

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, body);

    return { storageKey, mimeType };
  }

  async get(storageKey: string): Promise<StoredImageContent | null> {
    const absolutePath = this.resolveKey(storageKey);
    if (!absolutePath) {
      return null;
    }

    try {
      const body = await readFile(absolutePath);
      const extension = storageKey.split(".").pop() ?? "png";
      const mimeType =
        Object.entries(MIME_EXTENSIONS).find(([, ext]) => ext === extension)?.[0] ??
        "application/octet-stream";

      return { body, mimeType };
    } catch {
      // A missing file is an expected outcome (wiped disk, deleted set), not a fault.
      return null;
    }
  }

  async delete(storageKey: string): Promise<void> {
    const absolutePath = this.resolveKey(storageKey);
    if (!absolutePath) {
      return;
    }

    await rm(absolutePath, { force: true });
  }
}

export const mockupStorage: MockupStorage = new FilesystemMockupStorage(
  config.MOCKUP_STORAGE_DIR,
);
