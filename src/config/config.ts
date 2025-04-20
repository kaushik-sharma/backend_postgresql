import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.ENV!}` });

export default {
  development: {
    url: process.env.SUPABASE_CONNECTION_URI!,
    dialect: "postgres",
  },
  production: {
    url: process.env.SUPABASE_CONNECTION_URI!,
    dialect: "postgres",
  },
};
