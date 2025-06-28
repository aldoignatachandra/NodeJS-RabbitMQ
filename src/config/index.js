/**
 * Configuration Index
 *
 * This module aggregates and exports all application configurations
 * from a single entry point.
 */
import rabbitmqConfig from "./rabbitmq.js";
import serverConfig from "./server.js";
import databaseConfig from "./database.js";

export { rabbitmqConfig, serverConfig, databaseConfig };
