const express = require('express');
const router = express.Router();
const pool = require('../db');
const { config } = require('dotenv');
config();

// Obtener todos los eventos del usuario autenticado
router.get('/eventos/:correo_usuario', async (req, res) => {
    const { correo_usuario } = req.params;
    try {
        // Filtra los eventos por el correo del usuario autenticado
        const eventos = await pool.query('SELECT * FROM eventos WHERE correo_usuario = $1', [correo_usuario]);

        // Convertir fechas a formato de JavaScript para el frontend
        const eventosFormateados = eventos.rows.map(evento => ({
            ...evento,
            start: new Date(evento.fechaini), // Conversión a formato Date
            end: new Date(evento.fechafin) // Conversión a formato Date
        }));

        // Devuelve los eventos en formato JSON
        res.json(eventosFormateados);
    } catch (error) {
        console.error(error.message);
        res.status(500).json("Error en el servidor");
    }
});

// Agregar un nuevo evento
router.post('/eventos', async (req, res) => {
    try {
        const { title, desc, emocion, start, end, correo_usuario } = req.body;

        // Verificar que todos los campos necesarios estén presentes
        if (!title || !start || !end) {
            return res.status(400).json("Faltan datos requeridos");
        }

        // Agregar el nuevo evento a la base de datos
        const nuevoEvento = await pool.query(
            'INSERT INTO eventos (title, descripcion, emocion, fechaini, fechafin, correo_usuario) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, desc, emocion, start, end, correo_usuario]
        );

        // Devuelve el evento creado en formato JSON
        res.json(nuevoEvento.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json("Error en el servidor");
    }
});

// Actualizar un evento
router.put('/:id', async (req, res) => {
    const { id } = req.params; // ID del evento a actualizar
    const { title, desc, emocion, start, end } = req.body;

    try {
        // Actualizar el evento solo si existe
        const updatedEvent = await pool.query(
            'UPDATE eventos SET title = $1, descripcion = $2, emocion = $3, fechaini = $4, fechafin = $5 WHERE id = $6 RETURNING *',
            [title, desc, emocion, start, end, id]
        );

        if (updatedEvent.rows.length === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        res.json(updatedEvent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el evento' });
    }
});

module.exports = router;
