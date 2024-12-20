const express = require('express');
const router = express.Router();
const pool = require('../db'); // Conexión a la base de datos

// Obtener las emociones publicadas por el usuario
router.get('/emociones/:correo', async (req, res) => {
    const { correo } = req.params;

    const query = `
        SELECT 
            emocion,
            COUNT(*) AS cantidad
        FROM (
            SELECT 
                p.emocion_asociada AS emocion
            FROM Publicacion p
            WHERE p.correo_usuario = $1

            UNION ALL

            SELECT 
                e.emocion AS emocion
            FROM eventos e
            WHERE e.correo_usuario = $1
        ) AS subquery
        GROUP BY emocion
        ORDER BY cantidad DESC;
    `;

    try {
        const emociones = await pool.query(query, [correo]);
        res.json(emociones.rows);
    } catch (err) {
        console.error('Error al obtener las emociones:', err);
        res.status(500).json({ error: 'Error al obtener las emociones del usuario' });
    }
});

// Ruta para obtener datos generales del usuario
router.get('/info/:correo', async (req, res) => {
    const { correo } = req.params;

    const query = `
        SELECT 
            nombre_usuario,
            nombre_real,
            apellidos,
            fecha_nacimiento,
            ciudad,
            sexo
        FROM Usuario
        WHERE correo_electronico = $1;
    `;

    try {
        const userInfo = await pool.query(query, [correo]);
        if (userInfo.rows.length > 0) {
            res.json(userInfo.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener la información del usuario:', err);
        res.status(500).json({ error: 'Error al obtener la información del usuario' });
    }
});

router.get('/idfoto/:correo', async (req,res) => {
    const { correo } = req.params;

    const query = ` SELECT Usuario.racha_max, FotoPerfil.* 
                    FROM Usuario INNER JOIN FotoPerfil
                    ON Usuario.id_foto = FotoPerfil.id_foto
                    WHERE correo_electronico = $1;`;

    try {
        const userInfo = await pool.query(query, [correo]);
        if (userInfo.rows.length > 0) {
            res.json(userInfo.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener la información del usuario (rachas y foto):', err);
        res.status(500).json({ error: 'Error al obtener la información del usuario (rachas y foto' });
}})

// Ruta para actualizar la foto de perfil
router.put('/actualizarfoto/:correo', async (req, res) => {
    const { correo } = req.params;
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'El id foto es requerido' });
    }
    const query = ` UPDATE Usuario
                    SET id_foto = $1
                    WHERE correo_electronico = $2
                    RETURNING *;`;

    try {
        const userInfo = await pool.query(query, [id,correo]);
        if (userInfo.rows.length > 0) {
            res.json(userInfo.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error('Error al actualizar foto:', err);
        res.status(500).json({ error: 'Error al actualizar foto' });
}
});

module.exports = router;