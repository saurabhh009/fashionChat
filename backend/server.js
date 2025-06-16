const express=require('express')
const cors=require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const User=require("./schema/User")
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken')

const app=express()
app.use(cors({
  origin: 'https://fashion-chat-tau.vercel.app/',  // ✅ allow only your frontend
  credentials: true                 // ✅ allow cookies/auth headers
}));
app.use(express.json())
app.use(cookieParser())

port = process.env.PORT

app.listen(port, (req, resp)=>{
    console.log(`Server running on port ${port}`)
})

try{
    mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to database successfully')
}
catch{
    console.log("Error connecting to the database")
}


app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 🔐 Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 86400000, // 1 day
    });
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 🔐 Logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// 🧪 Example protected route
app.post('/protected', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Protected data', user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});
