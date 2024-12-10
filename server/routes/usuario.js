const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de rondas de salt
const jwtGenerator = require('../webToken/jwtGenerator.js')
const jwtForgot = require('../webToken/jwtForgotPass.js')
const auth = require('../webToken/accesoAutorizado.js')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer")
// Función para encriptar la contraseña
const {config} = require('dotenv') //Para ocultar credenciales
config(); 
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

     //2. Verificar que el Id y correo no existan
    const user = await pool.query("SELECT * FROM Usuario where nombre_usuario = $1", [nombre_usuario]);

    if(user.rows.length !== 0){
        console.log('1')
        return res.status(401).json({ error: 'Usuario ya registrado' });
    }

     const email = await pool.query("SELECT * FROM Usuario where correo_electronico = $1", [correo_electronico]);

    if(email.rows.length !== 0){
        console.log('2')
        return res.status(401).json({ error: 'El correo ya se encuentra registrado' });
    }

    // Consulta para insertar el nuevo usuario
    const query = `
      INSERT INTO Usuario (correo_electronico, nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, contraseña, sexo, hora_alerta, id_foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const values = [correo_electronico, nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, hashedPassword, sexo, hora_alerta,2];

    const result = await pool.query(query, values);

    const usuario = result.rows[0];

    const token = jwtGenerator(usuario.correo_electronico,usuario.nombre_usuario);

    res.status(201).json({ message: 'Usuario creado exitosamente', usuario: usuario,llave: token });
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
      console.log((result.rows[0]));
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
  const { nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, sexo } = req.body;

  try {
      // Verifica si hay datos para actualizar
      if (!nombre_usuario && !nombre_real && !apellidos && !fecha_nacimiento && !telefono && !ciudad && !sexo) {
          return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
      }

      // Verifica si el nombre de usuario ya existe para otro usuario (excluyendo el usuario actual)
      const nomUsuario = await pool.query(
          "SELECT * FROM Usuario WHERE nombre_usuario = $1 AND correo_electronico != $2", 
          [nombre_usuario, correo_electronico]
      );

      if (nomUsuario.rows.length > 0) {
          return res.status(409).json({ error: 'Usuario ya en Uso' });
      }

      // Realiza la actualización en la base de datos para la tabla Usuario
      const query = `
          UPDATE Usuario 
          SET nombre_usuario = $1, nombre_real = $2, apellidos = $3, fecha_nacimiento = $4, telefono = $5, ciudad = $6, sexo = $7
          WHERE correo_electronico = $8 
          RETURNING *;
      `;
      const values = [nombre_usuario, nombre_real, apellidos, fecha_nacimiento, telefono, ciudad, sexo, correo_electronico];
      const result = await pool.query(query, values);

      // Si no se encuentra el usuario, devuelve un error 404
      if (result.rows.length === 0) {

          return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Obtener el usuario actualizado
      const usuario = result.rows[0];

      // Actualiza el nombre de usuario en las publicaciones
      await pool.query(
          "UPDATE publicacion SET username = $1 WHERE correo_usuario = $2", 
          [nombre_usuario, correo_electronico]
      );

      // Genera el token
      const token = jwtGenerator(usuario.correo_electronico, usuario.nombre_usuario);

      // Devuelve la respuesta de éxito
      res.status(200).json({ message: 'Datos Actualizados', usuario: usuario, llave: token });

  } catch (err) {
      console.error('Error al actualizar el usuario:', err.message);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Ruta para actualizar clave de un usuario por correo electrónico
router.put('/clave/:correo_electronico', async (req, res) => {
  const { correo_electronico } = req.params;
  const { contraseña } = req.body;

  try {

    // Encriptar la contraseña
    const hashedPassword = await hashPassword(contraseña);

    const query = `
      UPDATE Usuario 
      SET contraseña = $1 
      WHERE correo_electronico = $2 
      RETURNING *;
    `;
    const values = [hashedPassword,correo_electronico];
    const result = await pool.query(query, values);


    const usuario = result.rows[0];
    const token = jwtGenerator(usuario.correo_electronico, usuario.nombre_usuario);

    // Devuelve la respuesta de éxito
    res.status(200).json({ message: 'Clave Actualizada ', usuario: usuario, llave: token });

  } catch (err) {
    console.error('Error al cambiar Clave:', err.message);
    res.status(500).json({ error: 'Error al cambiar Clave' });
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

//RECUPERAR CLAVE SESISON
router.post('/forget-password', async(req, res) => {
  try {
    const { correo_electronico } = req.body;

    if (!correo_electronico) {
      return res.status(400).json({ error: 'Brindar correo electrónico' });
    }

    const checkUser = await pool.query(
      "SELECT * FROM Usuario WHERE correo_electronico = $1", 
      [correo_electronico]
    );

    if (!(checkUser.rows.length > 0)) {
        console.log("No encontrado");
        return res.status(409).json({ error: 'Correo del usuario no encontrado' });
    } 

    const token = jwtForgot(correo_electronico);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const receiver = {
      from: process.env.MY_GMAIL,  // Usar el correo de envío
      replyTo: process.env.MY_GMAIL, // Usar el correo de respuesta
      to: correo_electronico,
      subject: "Solicitud de Cambio de Contraseña",
      html: `
        <h1>¡Hola!</h1>
        <p>Estás recibiendo este mensaje porque has solicitado un cambio de contraseña. Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${process.env.CLIENT_URL}/${token}">Restablecer mi contraseña</a>
        <p>Si no solicitaste este cambio, por favor ignora este correo.</p>
        <p>¡Gracias!</p>
      `,  // Usar HTML en lugar de texto plano
      headers: {
        'X-Mailer': 'NodeMailer',
        'X-Priority': '3', // Prioridad normal
      }
    };

    try {
      await transporter.sendMail(receiver);
      res.status(200).json({ message: 'Enlace enviado al correo' });
      console.log('Correo enviado');
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      res.status(500).json({ error: 'Error al enviar el correo' });
    }

  } catch (error) {
    console.error('Error en el proceso:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.put('/reset-password/:token', async(req,res) => {
  try {
    const {token} = req.params;
    const {contraseña} = req.body;

    if (!contraseña){
      return res.status(400).json({ error: 'Brindar contraseña' });
    }

    const decode = jwt.verify(token, process.env.jwtSecret2)
    console.log(decode)

    const query = 'SELECT * FROM Usuario WHERE correo_electronico = $1';
    const result = await pool.query(query, [decode.correo]);
    if (result.rows.length > 0) {
      console.log("datos:")
      console.log((result.rows[0]));
      
      //res.status(200).json(result.rows[0]);
    } else {
      
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    try {

      // Encriptar la contraseña
      const hashedPassword = await hashPassword(contraseña);
  
      const query = `
        UPDATE Usuario 
        SET contraseña = $1 
        WHERE correo_electronico = $2 
        RETURNING *;
      `;
      const values = [hashedPassword,decode.correo];
      const result2 = await pool.query(query, values);
  
  
      const usuario = result2.rows[0];
      const token = jwtGenerator(usuario.correo_electronico, usuario.nombre_usuario);
  
      // Devuelve la respuesta de éxito
      console.log("CLAVE ACTUALIZADA")
      return res.status(200).json({ message: 'Clave Actualizada ', usuario: usuario, llave: token });
  
    } catch (err) {
      console.error('Error al cambiar Clave:', err.message);
      res.status(500).json({ error: 'Error al cambiar Clave' });
    }


  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
})

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

router.put('/:correo_electronico/hora-alerta', async (req, res) => {
  const { correo_electronico } = req.params;
  const { hora_alerta } = req.body;

  try {
      // Verifica si el correo electrónico está en la base de datos
      const result = await pool.query(
          'UPDATE Usuario SET hora_alerta = $1 WHERE correo_electronico = $2 RETURNING *',
          [hora_alerta, correo_electronico]
      );
      
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Responde con los datos actualizados del usuario
      res.json(result.rows[0]);
  } catch (error) {
      console.error('Error al actualizar la hora de alerta:', error);
      res.status(500).json({ error: 'Error al actualizar la hora de alerta' });
  }
});


module.exports = router;
