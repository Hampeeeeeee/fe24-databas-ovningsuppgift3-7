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

// Endpoint som skapar Pokemons
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

// Endpoint som skapar användare
app.post('/Users', async (req, res) => {
    const { email, name, password, newsletter } = req.body;

    if(!email || !name || !password || !newsletter) {
        res.status(400).json({ message: 'Email, name, password, and newsletter are required!' });
        return;
    }

    try {
        const sql = `INSERT INTO Users (email, name, password, created, newsletter) VALUES (?, ?, ?, CURRENT_TIMESTAMP(), ?)`;
        const [ result ] = await pool.query(
            sql,
            [ email, name, password, newsletter ]
        );

        res.status(201).json({
            message: 'User created',
            id: result.insertId,
            email, 
            name, 
            password, 
            newsletter
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Endpoint som hämtar alla användare
app.get('/Users', async (req, res) => {

    try {
        const sql = 'SELECT * FROM Users';
        const [ rows ] = await pool.query(sql);
        res.json(rows);
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' });
    }

});

// Endpoint som hämtar alla Pokemons
app.get('/Pokemon', async (req, res) => {

    try {
        const sql = 'SELECT * FROM Pokemon';
        const [ rows ] = await pool.query(sql);
        res.json(rows);
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' });
    }

});

// Endpoint som hämtar alla pokemon med en satt minimumlängd eller 1 meter som standard
app.get('/Pokemon/minHeight', async (req, res) =>{

    const maximumWeight = parseFloat(req.query.maximumWeight);
    const minimumHeight = parseFloat(req.query.minimumHeight) || 1.0; // Standard value = 1 meter

    try {
        let sql = 'SELECT * FROM Pokemon WHERE height > ?';
        const params = [minimumHeight];

        if (!isNaN(maximumWeight)) {
            sql += ' AND weight < ?';
            params.push(maximumWeight);
        }
        
        const [rows] = await pool.query(sql, params); 
        res.json(rows);
    } 
    catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' })
    }
});

app.get('/Users/sort', async (req, res) => {

    try {
        const sql = 'SELECT * FROM Users ORDER BY created DESC';
        const [ rows ] = await pool.query(sql);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }

});


app.listen(PORT, () => {
    console.log('Server running at http://localhost:'+PORT);
});