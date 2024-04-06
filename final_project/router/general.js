const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Function to fetch the list of books using async-await with Axios
const getBookList = async () => {
    try {
        const response = await axios.get('http://localhost:3000/');
        return response.data.books;
    } catch (error) {
        console.error("Error fetching book list:", error);
        return [];
    }
};

// Function to fetch book details based on ISBN using async-await with Axios
const getBookDetailsByISBN = async (isbn) => {
    try {
        const response = await axios.get(`http://localhost:3000/isbn/${isbn}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching book details:", error);
        return null;
    }
};

// Function to fetch book details based on author using async-await with Axios
const getBookDetailsByAuthor = async (author) => {
    try {
        const response = await axios.get(`http://localhost:3000/author/${author}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching book details by author:", error);
        return [];
    }
};

// Function to fetch book details based on title using async-await with Axios
const getBookDetailsByTitle = async (title) => {
    try {
        const response = await axios.get(`http://localhost:3000/title/${title}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching book details by title:", error);
        return [];
    }
};

// Register a new user
public_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if the username already exists
    if (users[username]) {
        return res.status(400).json({ message: "Username already exists" });
    }

    // Add the new user to the users object
    users[username] = password;

    return res.status(200).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/', async (req, res) => {
    const bookList = await getBookList();
    res.send(JSON.stringify({ books: bookList }, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    const bookDetails = await getBookDetailsByISBN(isbn);
    if (bookDetails) {
        res.json(bookDetails);
    } else {
        res.status(404).json({ message: "Book not found" });
    }
});

// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
    const author = req.params.author;
    const bookDetails = await getBookDetailsByAuthor(author);
    res.json(bookDetails);
});

// Get book details based on title
public_users.get('/title/:title', async (req, res) => {
    const title = req.params.title;
    const bookDetails = await getBookDetailsByTitle(title);
    res.json(bookDetails);
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    // Check if the book exists in the database
    if (books[isbn]) {
        // If the book exists, send its reviews as the response
        res.json(books[isbn]["reviews"]);
    } else {
        // If the book does not exist, send an error response
        res.status(404).json({ message: "Book not found" });
    }
});

// Add or modify a book review
public_users.post('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const { username, review } = req.body;

    if (!username || !review) {
        return res.status(400).json({ message: "Username and review are required" });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the user has already reviewed the book
    let bookReviews = books[isbn]["reviews"];
    let existingReviewIndex = bookReviews.findIndex(entry => entry.username === username);

    if (existingReviewIndex !== -1) {
        // If the user has already reviewed the book, modify the existing review
        bookReviews[existingReviewIndex].review = review;
    } else {
        // If the user has not reviewed the book, add a new review
        bookReviews.push({ username, review });
    }

    // Update the book reviews
    books[isbn]["reviews"] = bookReviews;
    return res.status(200).json({ message: "Review added/modified successfully" });
});

// Delete a book review
public_users.delete("/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { username } = req.body;

    // Check if the username is provided
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the book has reviews
    if (!books[isbn].hasOwnProperty("reviews")) {
        return res.status(404).json({ message: "No reviews found for this book" });
    }

    // Check if the user has already reviewed the book
    const bookReviews = books[isbn].reviews;
    if (bookReviews.hasOwnProperty(username)) {
        // If the user has reviewed the book, delete the review
        delete bookReviews[username];
        return res.status(200).json({ message: "Review deleted successfully" });
    } else {
        return res.status(404).json({ message: "Review not found" });
    }
});

module.exports.general = public_users;
