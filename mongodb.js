
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is missing from .env');
}

const client = new MongoClient(uri);

export async function connectToMongoDB() {
  try {
    await client.connect();

    console.log('Successfully connected to MongoDB Atlas!');

    return client.db('studiospaceDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  await client.close();
}
