import express, { Application } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import { Database } from "./lib/types";
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "./graphql";

export async function createApp(db: Database): Promise<Application> {
  const app = express();

  app.use(bodyParser.json({ limit: "2mb" }));
  app.use(cookieParser(process.env.SECRET));
  app.use(compression());

  //app.use(express.static(`${__dirname}/client`));
  //app.get("/*", (_req, res) => res.sendFile(`${__dirname}/client/index.html`));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ db, req, res }),
  });

  server.applyMiddleware({ app, path: "/api" });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", async (_req, res) => {
    try {
      await db.ping();
      res.json({ status: "ready" });
    } catch (error) {
      console.error("Readiness check failed:", error);
      res.status(503).json({ status: "not ready" });
    }
  });

  return app;
}
