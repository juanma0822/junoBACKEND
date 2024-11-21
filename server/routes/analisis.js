const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ruta para obtener el análisis de emociones por género y edad
router.get('/emociones', async (req, res) => {
    try {
        const { genero } = req.query;

        const baseQuery = `
            SELECT 
                CASE 
                    WHEN edad BETWEEN 1 AND 5 THEN '1-5'
                    WHEN edad BETWEEN 6 AND 10 THEN '6-10'
                    WHEN edad BETWEEN 11 AND 15 THEN '11-15'
                    WHEN edad BETWEEN 16 AND 20 THEN '16-20'
                    WHEN edad BETWEEN 21 AND 25 THEN '21-25'
                    WHEN edad BETWEEN 26 AND 30 THEN '26-30'
                    WHEN edad BETWEEN 31 AND 40 THEN '31-40'
                    ELSE '41+' 
                END AS rango_edad,
                emocion,
                sexo,
                COUNT(*) AS cantidad
            FROM (
                SELECT 
                    DATE_PART('year', AGE(CURRENT_DATE, u.fecha_nacimiento)) AS edad,
                    p.emocion_asociada AS emocion,
                    u.sexo
                FROM Publicacion p
                JOIN Usuario u ON p.correo_usuario = u.correo_electronico
                UNION ALL
                SELECT 
                    DATE_PART('year', AGE(CURRENT_DATE, u.fecha_nacimiento)) AS edad,
                    e.emocion AS emocion,
                    u.sexo
                FROM eventos e
                JOIN Usuario u ON e.correo_usuario = u.correo_electronico
            ) AS subquery
            WHERE edad IS NOT NULL
        `;

        const finalQuery = genero
            ? `${baseQuery} AND sexo = $1 GROUP BY rango_edad, emocion, sexo ORDER BY rango_edad, emocion;`
            : `${baseQuery} GROUP BY rango_edad, emocion, sexo ORDER BY rango_edad, emocion;`;

        const result = await pool.query(finalQuery, genero ? [genero] : []);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener datos de emociones:', err);
        res.status(500).send('Error al obtener los datos de emociones');
    }
});

// Ruta para obtener todas las ciudades con publicaciones
router.get('/ciudades', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.ciudad AS ciudad,
                COUNT(p.id_publicacion) AS total_publicaciones
            FROM 
                Publicacion p
            INNER JOIN 
                Usuario u
            ON 
                p.correo_usuario = u.correo_electronico
            GROUP BY 
                u.ciudad
            ORDER BY 
                total_publicaciones DESC;
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener las ciudades:', err);
        res.status(500).send('Error al obtener las ciudades');
    }
});

// Ruta para obtener el top 5 de ciudades filtrado por emoción
router.get('/top-ciudades', async (req, res) => {
    try {
        const { emocion } = req.query;

        let query = `
            SELECT 
                u.ciudad AS ciudad,
                COUNT(p.id_publicacion) AS total_publicaciones
            FROM 
                Publicacion p
            INNER JOIN 
                Usuario u
            ON 
                p.correo_usuario = u.correo_electronico
        `;

        if (emocion) {
            query += ` WHERE p.emocion_asociada = $1 `;
        }

        query += `
            GROUP BY 
                u.ciudad
            ORDER BY 
                total_publicaciones DESC
            LIMIT 5;
        `;

        const result = await pool.query(query, emocion ? [emocion] : []);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener el top de ciudades:', err);
        res.status(500).send('Error al obtener el top de ciudades');
    }
});

module.exports = router;
