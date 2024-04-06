const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const regd_users = express.Router();

let users = [];

// Function to check if the user exists
const doesExist = (username) => {
    let usersWithSameName = users.filter((user) => {
        return user.username === username;
    });
    return usersWithSameName.length > 0;
}

// Function to check if the user is authenticated
const authenticatedUser = (username, password) => {
    let validUsers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    return validUsers.length > 0;
}

// Route to authenticate users
regd_users.use("/auth", function auth(req, res, next) {
    if (req.session.authorization) { // Check if session has authorization object
        token = req.session.authorization['accessToken']; // Retrieve the token from authorization object
        jwt.verify(token, "access", (err, user) => { // Verify JWT token
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});

// Route for user login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide both username and password" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(401).json({ message: "Invalid username or password" });
    }
});

// Route for user registration
regd_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        if (!doesExist(username)) {
            users.push({ "username": username, "password": password });
            return res.status(200).json({ message: "User successfully registered. Now you can login" });
        } else {
            return res.status(404).json({ message: "User already exists!" });
        }
    }
    return res.status(404).json({ message: "Unable to register user." });
});

// Endpoint for authenticated users
regd_users.get("/auth/get_message", (req, res) => {
    return res.status(200).json({ message: "Hello, You are an authenticated user. Congratulations!" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
