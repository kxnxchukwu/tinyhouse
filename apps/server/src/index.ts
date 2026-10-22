//require("dotenv").config();
import { connectDatabase } from "./database";
import { createApp } from "./app";

const mount = async () => {
  const db = await connectDatabase();
  const app = await createApp(db);
  const port = process.env.PORT;

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

mount().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Note: You will need to introduce a .env file at the root of the project
// that has the PORT, DB_USER, DB_USER_PASSWORD, and DB_CLUSTER environment variables defined.
// Otherwise, the server will not be able to start and/or connect to the database
