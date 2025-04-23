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

    const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
        const sql = `SELECT * FROM Users ORDER BY created ${order}`;
        const [ rows ] = await pool.query(sql);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }

});

app.get('/Pokemon/lastOnline', async (req, res) => {

    try {
        // Hämtar den senast inloggade användaren
        const [userRows] = await pool.query('SELECT id FROM Users ORDER BY lastLogin DESC LIMIT 1');
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Hämtar ID't på den senaste inloggade användaren
        const userId = userRows[0].id;

        // Hämtar pokemons från användaren som har varit inloggad senast
        const [pokemonRows] = await pool.query(`
            SELECT p.name
            FROM Pokemon p
            JOIN UserPokemons up ON p.id = up.pokemonId
            WHERE up.userId = ?
        `, [userId]);

        res.json(pokemonRows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

app.put('/Pokemon/update/:id', async (req, res) => {
    try {
        // Hämtar pokemon ID från parametern
        const pokemonId = req.params.id;

        // Hämtar den nya egenskapen från body
        const { name } = req.body;

        // Kontroll att ett namn har skickats med
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Fråga för att uppdatera pokemon
        const [result] = await pool.query(`
            UPDATE Pokemon
            SET name = ?
            WHERE id = ?
        `, [name, pokemonId]);

        // Ifall att inga rader uppdaterades
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pokemon not found' });
        }

        // Errorhantering
        res.json({ message: 'Pokemon updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

app.put('/Pokemon/updateWeight', async (req, res) => {

    try {
        // Uppdaterar alla pokemons vikt till "weight = ?"
        const [result] = await pool.query(
            `UPDATE Pokemon
            SET weight = weight - 2`
        );

        // Checkar om det finns en pokemon att uppdatera
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No pokemon to update!' });
        }

        // Errorhantering
        res.json({ message: 'Weights have been updated successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error' });
    }
})

app.listen(PORT, () => {
    console.log('Server running at http://localhost:'+PORT);
});