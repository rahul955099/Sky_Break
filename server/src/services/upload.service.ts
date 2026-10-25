import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { badRequest } from "../utils/http.js";
import { randomToken } from "../utils/security.js";

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
type AllowedMime = keyof typeof ALLOWED;

/** Files are held in memory so their real signature can be checked before anything touches disk. */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in ALLOWED) cb(null, true);
    else cb(badRequest("Only JPEG, PNG, WebP or AVIF images are allowed"));
  },
});

function sniff(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(buf.toString("ascii", 8, 12))) return "image/avif";
  return null;
}

export async function saveImage(file: Express.Multer.File | undefined) {
  if (!file) throw badRequest("No image file received (field name: image)");
  const detected = sniff(file.buffer);
  if (!detected || detected !== file.mimetype) throw badRequest("File content does not match an allowed image type");
  await fs.mkdir(uploadDir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomToken(9)}.${ALLOWED[detected]}`;
  await fs.writeFile(path.join(uploadDir, name), file.buffer, { flag: "wx" });
  return { url: `/uploads/${name}`, size: file.size, mimeType: detected };
}
