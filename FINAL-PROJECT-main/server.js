const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelwebsite')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
    });

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    mobileNumber: String,
    dob: Date,
    gender: String,
    password: String,
});

// Create User Model
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(session({
    secret: 'your_secret_key', // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
}));

// Set view engine to EJS
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('home', { title: 'Home - Our Travel Website' }); // Render the home.ejs file with a title
});


app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up - Our Travel Website' }); // Render the signup.ejs file with a title
});

app.get('/signin', (req, res) => {
    res.render('signin', { title: 'Sign In - Our Travel Website' }); // Render the signin.ejs file with a title
});


app.post('/signup', async (req, res) => {
    const { name, email, mobileNumber, dob, gender, password } = req.body;
    console.log("Received signup data:", req.body);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Create new user
        const user = new User({ name, email, mobileNumber, dob, gender, password: hashedPassword });
        await user.save();
        console.log("User created successfully");
        res.redirect('/signin'); // Redirect to the sign-in page after signup
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate email error
            res.status(400).send('Email already exists. Please use a different email.');
        } else {
            console.error('Error saving user to database:', error.message);
            res.status(400).send('Error saving user to database.'); // Handle error
        }
    }
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // Check if the user exists and if the password is correct
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id; // Store user ID in session
            res.redirect('/'); // Redirect to homepage after login
        } else {
            res.status(400).send('Invalid email or password.');
        }
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(400).send('Error logging in.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
