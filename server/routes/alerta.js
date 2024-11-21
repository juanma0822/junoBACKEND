const express = require('express');
const router = express.Router();
const pool = require('../db'); // Conexión a la base de datos

// Endpoint para verificar y obtener la alerta personalizada
router.get('/:correo', async (req, res) => {
    const { correo } = req.params;

    try {
        // Obtener la hora actual en formato HH:MM
        let horaActual = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        // Verificar si la hora actual coincide con la hora_alerta del usuario
        const alertaResult = await pool.query(`
            SELECT TO_CHAR(hora_alerta, 'HH24:MI') AS hora_alerta
            FROM Usuario
            WHERE correo_electronico = $1
        `, [correo]);

        // Verificar si la hora es 24 o superior (es decir, 24:01, 24:59)
        const [horas, minutos] = horaActual.split(':').map(Number);
        
        if (horas === 24) {
            // Convertir cualquier hora mayor a 24 a su formato correcto (00:01, 00:59)
            horaActual = `00:${String(minutos).padStart(2, '0')}`;
        }

        if (alertaResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const horaAlerta = alertaResult.rows[0].hora_alerta;
        
        if (horaActual !== horaAlerta) {
            return res.json({ mostrarAlerta: false }); // No coincide la hora
        }

        // Obtener la emoción más publicada
        const emocionResult = await pool.query(`
            SELECT emocion_asociada
            FROM Publicacion
            WHERE correo_usuario = $1
            GROUP BY emocion_asociada
            ORDER BY COUNT(*) DESC
            LIMIT 1;
        `, [correo]);

        if (emocionResult.rows.length === 0) {
            return res.status(404).json({ message: 'No hay emociones registradas para este usuario.' });
        }

        const emocion = emocionResult.rows[0].emocion_asociada;

        // Obtener una frase aleatoria asociada a la emoción
        const fraseResult = await pool.query(`
            SELECT texto_frase
            FROM Frases
            WHERE emocion_asociada = $1
            ORDER BY RANDOM()
            LIMIT 1;
        `, [emocion]);

        if (fraseResult.rows.length === 0) {
            return res.status(404).json({ message: `No hay frases disponibles para la emoción ${emocion}.` });
        }

        res.json({
            mostrarAlerta: true,
            emocion,
            frase: fraseResult.rows[0].texto_frase,
        });
        console.log("Alerta enviada exitosamente!")
    } catch (error) {
        console.error('Error al obtener la alerta:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error });
    }
});

module.exports = router;
