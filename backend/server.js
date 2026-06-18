const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/stops', require('./routes/stops'));

app.get('/', (req, res) => {
    res.send('Route Guider Pro API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
