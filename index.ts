import dotEnv from "dotenv";
import path from "path";
import cron from "node-cron";

import { syncLinkedEventsToDrupal } from "./linkedEventsSyncToDrupal";

dotEnv.config({ path: path.resolve(__dirname + "/../.env") });

const syncEventsToDrupal = async () => {
  console.log("------");
  console.log("start event sync", new Date());
  console.log("SYNC LINKED EVENTS");
  await syncLinkedEventsToDrupal();
};

syncEventsToDrupal();

// Sync events every 20 minutes
cron.schedule("*/15 * * * *", async () => {
  syncEventsToDrupal();
});
