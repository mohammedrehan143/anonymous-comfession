// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Example Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Hello! Your server is working fine 🚀');
});

app.post('/add-user', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: '✅ User added successfully!' });
  } catch (err) {
    res.status(500).json({ error: '❌ Error adding user', details: err });
  }
});

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
