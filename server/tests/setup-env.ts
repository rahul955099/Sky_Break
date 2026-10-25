import { testDatabaseUrl } from "./test-db.js";

process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = "test";
process.env.EMAIL_PROVIDER = "none";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.PUBLIC_SITE_URL = "https://www.example-site.test";
process.env.UPLOAD_DIR = "uploads-test";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-123456";
