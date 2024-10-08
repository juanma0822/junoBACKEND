const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ruta para crear una publicación
router.post('/', async (req, res) => {
  const { contenido, emocion_asociada, fecha_evento, correo_usuario, username } = req.body;

  try {
    // Validación básica de los datos
    if (!contenido || !correo_usuario || !username) {
      return res.status(400).json({ error: 'Contenido, correo del usuario y nombre de usuario son obligatorios' });
    }

    // Consulta para insertar una nueva publicación
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

// Ruta para obtener todas las publicaciones
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Publicacion';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener las publicaciones:', err.message);
    res.status(500).json({ error: 'Error al obtener las publicaciones' });
  }
});

// Ruta para obtener todas las publicaciones de un usuario por correo electrónico
router.get('/usuario/:correo_usuario', async (req, res) => {
  const { correo_usuario } = req.params;

  try {
    const query = 'SELECT * FROM Publicacion WHERE correo_usuario = $1';
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

// Ruta para obtener una publicación por ID
router.get('/:id_publicacion', async (req, res) => {
  const { id_publicacion } = req.params;

  try {
    const query = 'SELECT * FROM Publicacion WHERE id_publicacion = $1';
    const result = await pool.query(query, [id_publicacion]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Publicación no encontrada' });
    }
  } catch (err) {
    console.error('Error al obtener la publicación:', err.message);
    res.status(500).json({ error: 'Error al obtener la publicación' });
  }
});

// Ruta para actualizar una publicación por ID
router.put('/:id_publicacion', async (req, res) => {
  const { id_publicacion } = req.params;
  const { contenido, emocion_asociada, fecha_evento, correo_usuario, username } = req.body;

  try {
    if (!contenido && !emocion_asociada && !fecha_evento && !correo_usuario && !username) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    let query = 'UPDATE Publicacion SET';
    const values = [];
    let i = 1;

    if (contenido) {
      query += ` contenido = $${i++},`;
      values.push(contenido);
    }
    if (emocion_asociada) {
      query += ` emocion_asociada = $${i++},`;
      values.push(emocion_asociada);
    }
    if (fecha_evento) {
      query += ` fecha_evento = $${i++},`;
      values.push(fecha_evento);
    }
    if (correo_usuario) {
      query += ` correo_usuario = $${i++},`;
      values.push(correo_usuario);
    }
    if (username) {
      query += ` username = $${i++},`;
      values.push(username);
    }

    query = query.slice(0, -1) + ` WHERE id_publicacion = $${i}`;
    values.push(id_publicacion);

    const result = await pool.query(query, values);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Publicación actualizada exitosamente' });
    } else {
      res.status(404).json({ error: 'Publicación no encontrada' });
    }
  } catch (err) {
    console.error('Error al actualizar la publicación:', err.message);
    res.status(500).json({ error: 'Error al actualizar la publicación' });
  }
});

// Ruta para eliminar una publicación por ID
router.delete('/:id_publicacion', async (req, res) => {
  const { id_publicacion } = req.params;

  try {
    const query = 'DELETE FROM Publicacion WHERE id_publicacion = $1 RETURNING *';
    const result = await pool.query(query, [id_publicacion]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Publicación eliminada exitosamente' });
    } else {
      res.status(404).json({ error: 'Publicación no encontrada' });
    }
  } catch (err) {
    console.error('Error al eliminar la publicación:', err.message);
    res.status(500).json({ error: 'Error al eliminar la publicación' });
  }
});

// Ruta para obtener las publicaciones de los amigos de un usuario por su correo electrónico
router.get('/amigos/:correo_usuario', async (req, res) => {
  const { correo_usuario } = req.params;

  try {
    // Consulta para obtener los correos de los amigos cuyo estado de amistad es "aceptada"
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

    // Crear una lista con los correos de los amigos
    const amigosCorreos = amigosResult.rows.map(row => {
      return row.correo_usuario_envia === correo_usuario ? row.correo_usuario_recibe : row.correo_usuario_envia;
    });

    // Consulta para obtener las publicaciones de los amigos
    const publicacionesQuery = `
      SELECT * 
      FROM Publicacion
      WHERE correo_usuario = ANY($1::text[])
      ORDER BY id_publicacion ASC;
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
