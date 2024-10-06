const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de rondas de salt
const jwtGenerator = require('../webToken/jwtGenerator.js')
const auth = require('../webToken/accesoAutorizado.js')
// Función para encriptar la contraseña
const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (err) {
    console.error('Error al encriptar la contraseña:', err);
    throw err;
  }
};

router.get('/estalogin',auth,async (req,res) =>{

  //Aca en si la verificacon la hizo el Middleware, si llego a este punto es porque
  //si esta autenticado, por eso se retorna el True
  try {
      res.json({token: true, correo: req.correo, nombre: req.nombre})
  } catch (error) {
      console.error(error.message);
      res.status(500).json(error.message); //Error del servidor
  }
});

// Ruta para crear un nuevo usuario
router.post('/', async (req, res) => {
  const { correo_electronico, nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, contraseña, sexo, hora_alerta } = req.body;

  try {
    if (!correo_electronico || !nombre_usuario || !nombre_real || !apellidos || !contraseña) {
      return res.status(400).json({ error: 'Correo electrónico, nombre de usuario, nombre real, apellidos y contraseña son obligatorios' });
    }

    // Encriptar la contraseña
    const hashedPassword = await hashPassword(contraseña);

    // Consulta para insertar el nuevo usuario
    const query = `
      INSERT INTO Usuario (correo_electronico, nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, contraseña, sexo, hora_alerta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [correo_electronico, nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, hashedPassword, sexo, hora_alerta];

    const result = await pool.query(query, values);

    res.status(201).json({ message: 'Usuario creado exitosamente', usuario: result.rows[0] });
  } catch (err) {
    console.error('Error al crear el usuario:', err);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Ruta para obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    // Consulta para obtener todos los usuarios
    const query = 'SELECT * FROM Usuario';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los usuarios:', err.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Ruta para obtener un usuario por su correo electrónico
router.get('/:correo_electronico', async (req, res) => {
  const { correo_electronico } = req.params;

  try {
    // Consulta para obtener un usuario por correo electrónico
    const query = 'SELECT * FROM Usuario WHERE correo_electronico = $1';
    const result = await pool.query(query, [correo_electronico]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al obtener el usuario:', err.message);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// Ruta para obtener el correo electrónico de un usuario por su nombre de usuario
router.get('/correo/:nombre_usuario', async (req, res) => {
  const { nombre_usuario } = req.params;

  try {
    // Consulta para obtener el correo electrónico del usuario por su nombre de usuario
    const query = 'SELECT correo_electronico FROM Usuario WHERE nombre_usuario = $1';
    const result = await pool.query(query, [nombre_usuario]);

    if (result.rows.length > 0) {
      res.status(200).json({ correo_electronico: result.rows[0].correo_electronico });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al obtener el correo del usuario:', err.message);
    res.status(500).json({ error: 'Error al obtener el correo del usuario' });
  }
});

// Ruta para actualizar un usuario por correo electrónico
router.put('/:correo_electronico', async (req, res) => {
  const { correo_electronico } = req.params;
  const { nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, contraseña, sexo, hora_alerta } = req.body;

  try {
    if (!nombre_usuario && !nombre_real && !apellidos && !fecha_nacimiento && !telefono && !ciudad && !contraseña && !sexo && !hora_alerta) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    // Construir la consulta SQL dinámicamente
    let query = 'UPDATE Usuario SET';
    const values = [];
    let i = 1;

    if (nombre_usuario) {
      query += ` nombre_usuario = $${i++},`;
      values.push(nombre_usuario);
    }
    if (nombre_real) {
      query += ` nombre_real = $${i++},`;
      values.push(nombre_real);
    }
    if (apellidos) {
      query += ` apellidos = $${i++},`;
      values.push(apellidos);
    }
    if (fecha_nacimiento) {
      query += ` fecha_nacimiento = $${i++},`;
      values.push(fecha_nacimiento);
    }
    if (telefono) {
      query += ` telefono = $${i++},`;
      values.push(telefono);
    }
    if (ciudad) {
      query += ` ciudad = $${i++},`;
      values.push(ciudad);
    }
    if (contraseña) {
      // Encriptar la contraseña antes de actualizar
      const hashedPassword = await hashPassword(contraseña);
      query += ` contraseña = $${i++},`;
      values.push(hashedPassword);
    }
    if (sexo) {
      query += ` sexo = $${i++},`;
      values.push(sexo);
    }
    if (hora_alerta) {
      query += ` hora_alerta = $${i++},`;
      values.push(hora_alerta);
    }

    // Eliminar la última coma y agregar la condición WHERE
    query = query.slice(0, -1) + ` WHERE correo_electronico = $${i}`;
    values.push(correo_electronico);

    const result = await pool.query(query, values);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al actualizar el usuario:', err.message);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Ruta para eliminar un usuario por correo electrónico
router.delete('/:correo_electronico', async (req, res) => {
  const { correo_electronico } = req.params;

  try {
    const query = 'DELETE FROM Usuario WHERE correo_electronico = $1 RETURNING *';
    const result = await pool.query(query, [correo_electronico]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al eliminar el usuario:', err.message);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});



// Ruta para INICIAR SESION
router.post('/login', async (req, res) => {
  console.log('Datos recibidos:', req.body); // Agrega esta línea
    const { correo_electronico, contraseña } = req.body;
  
    try {
      if (!correo_electronico || !contraseña) {
        return res.status(400).json({ error: 'Correo electrónico y contraseña son obligatorios' });
      }
  
      // Consulta para obtener el usuario por correo electrónico
      const query = 'SELECT * FROM Usuario WHERE correo_electronico = $1';
      const result = await pool.query(query, [correo_electronico]);
  
      // Verificar si se encontró el usuario
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      // Obtener el usuario encontrado
      const usuario = result.rows[0];
  
      // Comparar la contraseña proporcionada con la almacenada en la base de datos
      const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
  
      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwtGenerator(usuario.correo_electronico,usuario.nombre_usuario);
      res.status(200).json({llave: token, message: 'Inicio de sesión exitoso', usuario});
        
  
  
    } catch (err) {
      console.error('Error al iniciar sesión:', err.message);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  });

// Ruta para obtener el nombre de un usuario por su correo electrónico
router.get('/nombre/:correo_electronico', async (req, res) => {
  const { correo_electronico } = req.params;

  try {
    // Consulta para obtener el nombre del usuario por correo electrónico
    const query = 'SELECT nombre_usuario FROM Usuario WHERE correo_electronico = $1';
    const result = await pool.query(query, [correo_electronico]);

    if (result.rows.length > 0) {
      res.status(200).json({ nombre: result.rows[0].nombre_usuario });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al obtener el nombre del usuario:', err.message);
    res.status(500).json({ error: 'Error al obtener el nombre del usuario' });
  }
});

  



module.exports = router;
