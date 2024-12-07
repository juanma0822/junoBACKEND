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

        if (!title || !start || !end || !correo_usuario) {
            return res.status(400).json("Faltan datos requeridos");
        }

        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);

        const eventoExistente = await pool.query(
            'SELECT * FROM eventos WHERE correo_usuario = $1 AND title LIKE $2 AND fechaini >= $3 AND fechaini < $4',
            [correo_usuario, 'Racha Diaria%', fechaHoy, new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)]
        );

        if (eventoExistente.rows.length > 0 && title.includes('Racha Diaria')) {
            return res.status(400).json({
                message: `Ya registraste tu racha diaria por hoy.`,
            });
        }

        // Insertar el nuevo evento
        const nuevoEvento = await pool.query(
            'INSERT INTO eventos (title, descripcion, emocion, fechaini, fechafin, correo_usuario) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, desc, emocion, start, end, correo_usuario]
        );
        
        // Calcular la racha actual después de agregar cualquier evento
        // Calcular la racha actual después de agregar cualquier evento
        try {
            // Obtener todos los eventos "felices" del usuario
            const eventosFelices = await pool.query(
                `SELECT DISTINCT fechaini::date AS fecha
                FROM eventos
                WHERE correo_usuario = $1
                AND LOWER(emocion) = 'feliz'
                ORDER BY fechaini::date ASC`,
                [correo_usuario]
            );
        
            // Calcular la racha actual
            let rachaActualCount = 0;
            let rachaMax = 0;
            let fechaAnterior = null;
        
            eventosFelices.rows.forEach(evento => {
                const fechaEvento = new Date(evento.fecha);
        
                if (!fechaAnterior) {
                    // Primera fecha
                    fechaAnterior = fechaEvento;
                    rachaActualCount = 1;
                } else {
                    const diferenciaDias =
                        (fechaEvento.getTime() - fechaAnterior.getTime()) / (1000 * 60 * 60 * 24);
        
                    if (diferenciaDias === 1) {
                        // Fecha es un día después de la anterior, continúa la racha
                        rachaActualCount++;
                    } else if (diferenciaDias > 1) {
                        // Fecha no es consecutiva, reinicia la racha
                        rachaActualCount = 1;
                    }
        
                    // Actualizar la fecha anterior
                    fechaAnterior = fechaEvento;
                }
        
                // Actualizar racha máxima
                rachaMax = Math.max(rachaMax, rachaActualCount);
            });
        
            // Actualizar la racha máxima en la tabla Usuario
            await pool.query(
                'UPDATE Usuario SET racha_max = $1 WHERE correo_electronico = $2',
                [rachaMax, correo_usuario]
            );
        } catch (error) {
            console.error("Error al calcular la racha:", error.message);
            res.status(500).json("Error al calcular la racha");
        }
        
        // Enviar respuesta del nuevo evento
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
        // Verificar si el evento tiene el título "Racha Diaria"
        if (title && title.includes('Racha Diaria')) {
            return res.status(400).json({ message: 'No se puede editar el evento de Racha Diaria.' });
        }

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
