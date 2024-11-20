const express = require('express');
const pool = require('../db'); // Asegúrate de tener tu pool configurado
const router = express.Router();

//RUTAS DE AMIGOS

// Crear solicitud de amistad
router.post('/enviar-solicitud', async (req, res) => {
    const { correo_envia, correo_recibe } = req.body;
    try {
        // Verificar si ya existe una solicitud o amistad entre los usuarios
        const existingFriendship = await pool.query(
            'SELECT * FROM Amistad WHERE (correo_usuario_envia = $1 AND correo_usuario_recibe = $2) OR (correo_usuario_envia = $2 AND correo_usuario_recibe = $1)',
            [correo_envia, correo_recibe]
        );

        if (existingFriendship.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe una solicitud o amistad entre estos usuarios.' });
        }

        // Insertar la nueva solicitud de amistad con estado "pendiente"
        const nuevaSolicitud = await pool.query(
            'INSERT INTO Amistad (estado, correo_usuario_envia, correo_usuario_recibe) VALUES ($1, $2, $3) RETURNING *',
            ['pendiente', correo_envia, correo_recibe]
        );

        res.status(200).json({ message: 'Solicitud de amistad enviada', solicitud: nuevaSolicitud.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar la solicitud' });
    }
});

// Obtener todos los amigos de un usuario
router.get('/amigos/:correo_usuario', async (req, res) => {
    const { correo_usuario } = req.params;

    try {
        const amigos = await pool.query(
            'SELECT * FROM Amistad WHERE (correo_usuario_envia = $1 OR correo_usuario_recibe = $1) AND estado = $2',
            [correo_usuario, 'aceptada']
        );

        res.status(200).json(amigos.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la lista de amigos' });
    }
});


// Aceptar solicitud de amistad// Aceptar solicitud de amistad por correos
router.put('/aceptar-solicitud', async (req, res) => {
    const { correo_envia, correo_recibe } = req.body;

    try {
        // Actualizar el estado a 'aceptada'
        const amistadAceptada = await pool.query(
            'UPDATE Amistad SET estado = $1 WHERE correo_usuario_envia = $2 AND correo_usuario_recibe = $3 RETURNING *',
            ['aceptada', correo_envia, correo_recibe]
        );

        if (amistadAceptada.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró la solicitud de amistad.' });
        }

        res.status(200).json({ message: 'Solicitud aceptada', amistad: amistadAceptada.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al aceptar la solicitud' });
    }
});


// Rechazar solicitud de amistad
router.put('/rechazar-solicitud', async (req, res) => {
    const { id_amistad } = req.body;

    try {
        // Eliminar la solicitud de amistad
        const solicitudRechazada = await pool.query(
            'DELETE FROM Amistad WHERE id_amistad = $1 RETURNING *',
            [id_amistad]
        );

        res.status(200).json({ message: 'Solicitud rechazada', solicitud: solicitudRechazada.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al rechazar la solicitud' });
    }
});


// Obtener solicitudes de amistad pendientes con nombres de usuarios
router.get('/solicitudes-pendientes/:correo_usuario', async (req, res) => {
    const { correo_usuario } = req.params;

    try {
        const solicitudesPendientes = await pool.query(
            `SELECT A.*, U.nombre_usuario as nombre_envia, U2.nombre_usuario as nombre_recibe
             FROM Amistad A
             JOIN Usuario U ON A.correo_usuario_envia = U.correo_electronico
             JOIN Usuario U2 ON A.correo_usuario_recibe = U2.correo_electronico
             WHERE A.correo_usuario_recibe = $1 AND A.estado = $2`,
            [correo_usuario, 'pendiente']
        );

        res.status(200).json(solicitudesPendientes.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las solicitudes pendientes' });
    }
});


// Eliminar amistad
router.delete('/eliminar-amistad', async (req, res) => {
    const { correo_envia, correo_recibe } = req.body;

    try {
        // Eliminar la relación de amistad
        const amistadEliminada = await pool.query(
            'DELETE FROM Amistad WHERE (correo_usuario_envia = $1 AND correo_usuario_recibe = $2) OR (correo_usuario_envia = $2 AND correo_usuario_recibe = $1) RETURNING *',
            [correo_envia, correo_recibe]
        );

        if (amistadEliminada.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró la amistad para eliminar.' });
        }

        res.status(200).json({ message: 'Amistad eliminada', amistad: amistadEliminada.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la amistad' });
    }
});


module.exports = router;
