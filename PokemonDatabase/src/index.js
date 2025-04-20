require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Skapa en anslutningspool till databasen
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.post('/Pokemon', async (req, res) => {
    
    const { name, height, weight } = req.body;

    if(!name || !height || !weight) {
        res.status(400).json({ message: 'Name, height and weight are required' });
        return;
    }

    try {
        const sql = `INSERT INTO Pokemon (name, height, weight) VALUES (?, ?, ?)`;
        const [ result ] = await pool.query(
            sql,
            [ name, height, weight ]
        );

        res.status(201).json({
            message: 'Pokemon created',
            id: result.insertId,
            name, 
            height, 
            weight
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' });
    }

});

app.listen(PORT, () => {
    console.log('Server running at http://localhost:'+PORT);
});