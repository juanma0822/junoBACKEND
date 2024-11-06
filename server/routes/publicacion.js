const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ruta para crear una publicación
router.post('/', async (req, res) => {
  const { contenido, emocion_asociada, fecha_evento, correo_usuario, username } = req.body;

  try {
    if (!contenido || !correo_usuario || !username) {
      return res.status(400).json({ error: 'Contenido, correo del usuario y nombre de usuario son obligatorios' });
    }

    const query = `
      INSERT INTO Publicacion (contenido, emocion_asociada, fecha_evento, correo_usuario, username)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [contenido, emocion_asociada, fecha_evento, correo_usuario, username];
    const result = await pool.query(query, values);

    res.status(201).json({ message: 'Publicación creada exitosamente', publicacion: result.rows[0] });
  } catch (err) {
    console.error('Error al crear la publicación:', err);
    res.status(500).json({ error: 'Error al crear la publicación' });
  }
});

// Ruta para obtener todas las publicaciones (ordenadas por fecha descendente)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Publicacion ORDER BY fecha_evento ASC';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener las publicaciones:', err.message);
    res.status(500).json({ error: 'Error al obtener las publicaciones' });
  }
});

// Ruta para obtener todas las publicaciones de un usuario (ordenadas por fecha descendente)
router.get('/usuario/:correo_usuario', async (req, res) => {
  const { correo_usuario } = req.params;

  try {
    const query = 'SELECT * FROM Publicacion WHERE correo_usuario = $1 ORDER BY fecha_evento ASC';
    const result = await pool.query(query, [correo_usuario]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ error: 'No se encontraron publicaciones para este usuario' });
    }
  } catch (err) {
    console.error('Error al obtener las publicaciones del usuario:', err.message);
    res.status(500).json({ error: 'Error al obtener las publicaciones del usuario' });
  }
});

// Ruta para obtener las publicaciones de los amigos de un usuario por su correo electrónico (ordenadas por fecha descendente)
router.get('/amigos/:correo_usuario', async (req, res) => {
  const { correo_usuario } = req.params;

  try {
    const amigosQuery = `
      SELECT correo_usuario_envia, correo_usuario_recibe
      FROM Amistad
      WHERE (correo_usuario_envia = $1 OR correo_usuario_recibe = $1)
      AND estado = 'aceptada'
    `;

    const amigosResult = await pool.query(amigosQuery, [correo_usuario]);

    if (amigosResult.rows.length === 0) {
      return res.status(404).json({ error: 'Este usuario no tiene amigos o no hay amistades aceptadas.' });
    }

    const amigosCorreos = amigosResult.rows.map(row => {
      return row.correo_usuario_envia === correo_usuario ? row.correo_usuario_recibe : row.correo_usuario_envia;
    });

    const publicacionesQuery = `
      SELECT * 
      FROM Publicacion
      WHERE correo_usuario = ANY($1::text[])
      ORDER BY fecha_evento ASC;
    `;

    const publicacionesResult = await pool.query(publicacionesQuery, [amigosCorreos]);

    if (publicacionesResult.rows.length > 0) {
      res.status(200).json(publicacionesResult.rows);
    } else {
      res.status(404).json({ error: 'No se encontraron publicaciones de los amigos.' });
    }
  } catch (err) {
    console.error('Error al obtener las publicaciones de los amigos:', err.message);
    res.status(500).json({ error: 'Error al obtener las publicaciones de los amigos' });
  }
});

module.exports = router;
