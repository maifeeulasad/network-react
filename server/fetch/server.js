const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const faker = require('faker');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Optional: rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Mock DB
let users = Array.from({ length: 10 }, () => ({
  id: faker.datatype.uuid(),
  name: faker.name.findName(),
  email: faker.internet.email(),
}));

// Routes

app.get('/', (req, res) => {
  res.send('REST API server is running!');
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  const newUser = {
    id: faker.datatype.uuid(),
    name,
    email
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { name, email } = req.body;
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = name;
  user.email = email;
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  const initialLength = users.length;
  users = users.filter(u => u.id !== req.params.id);
  if (users.length === initialLength) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(204).send();
});

// Benchmark endpoint
app.get('/api/heavy', (req, res) => {
  const data = Array.from({ length: 1000 }, () => faker.lorem.paragraph());
  res.json({ size: data.length });
});

app.listen(port, () => {
  console.log(`🚀 REST API server running at http://localhost:${port}`);
});
