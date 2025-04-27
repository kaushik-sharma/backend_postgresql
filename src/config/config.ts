import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.ENV!}` });

export default {
  development: {
    url: process.env.SUPABASE_SUPER_USER_CONNECTION_URI!,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs.readFileSync(
          process.env.SUPABASE_DB_SSL_CERT_FILE_NAME!,
          "utf8"
        ),
      },
    },
  },
  production: {
    url: process.env.SUPABASE_SUPER_USER_CONNECTION_URI!,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs.readFileSync(
          process.env.SUPABASE_DB_SSL_CERT_FILE_NAME!,
          "utf8"
        ),
      },
    },
  },
};
