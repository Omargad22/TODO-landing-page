const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "your_secret_key_here";

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) return res.status(403).json({ error: "No token provided" });

    const token = tokenHeader.split(' ')[1]; // Bearer <token>

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: "Failed to authenticate token" });
        req.userId = decoded.id;
        next();
    });
};

// Get all todos for a user
router.get('/', verifyToken, (req, res) => {
    const sql = "SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC";
    db.all(sql, [req.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Create a new todo
router.post('/', verifyToken, (req, res) => {
    const { task, deadline, priority } = req.body;
    if (!task) {
        return res.status(400).json({ error: "Task content is required" });
    }

    const sql = "INSERT INTO todos (user_id, task, deadline, priority) VALUES (?,?,?,?)";
    db.run(sql, [req.userId, task, deadline || null, priority || 'medium'], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: "Todo created",
            data: { id: this.lastID, task, completed: 0, deadline: deadline || null, priority: priority || 'medium' }
        });
    });
});

// Update a todo (Mark as completed or change text/deadline/priority)
router.put('/:id', verifyToken, (req, res) => {
    const { task, completed, deadline, priority } = req.body;
    const todoId = req.params.id;

    // First check if todo belongs to user
    db.get("SELECT * FROM todos WHERE id = ? AND user_id = ?", [todoId, req.userId], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: "Todo not found or unauthorized" });
        }

        const sql = `UPDATE todos SET 
            task = COALESCE(?, task), 
            completed = COALESCE(?, completed),
            deadline = COALESCE(?, deadline),
            priority = COALESCE(?, priority) 
            WHERE id = ?`;

        db.run(sql, [task, completed, deadline, priority, todoId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: "Todo updated",
                changes: this.changes
            });
        });
    });
});

// Delete a todo
router.delete('/:id', verifyToken, (req, res) => {
    const todoId = req.params.id;

    const sql = "DELETE FROM todos WHERE id = ? AND user_id = ?";
    db.run(sql, [todoId, req.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Todo not found or unauthorized" });

        res.json({ message: "Deleted", changes: this.changes });
    });
});

module.exports = router;
