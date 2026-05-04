import * as dotenv from 'dotenv';
dotenv.config();

// dev or prod
export const ENV = `${process.env.ENV}`;

// server
export const SERVER_PORT = process.env.SERVER_PORT !== undefined ? `${process.env.SERVER_PORT}` : 4900;