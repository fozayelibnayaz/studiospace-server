import express from 'express';
import { connectToMongoDB } from './src/config/mongodb.js';

const app = express();

app.use(express.json());

const db = await connectToMongoDB();

// Example collection
const studios = db.collection('studios');

app.get('/', (req, res) => {
  res.send('StudioSpace API is running!');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});