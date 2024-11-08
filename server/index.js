const express = require("express");
const app= express();
const cors = require("cors");
const pool = require("./db");
const usuarioRoutes = require('./routes/usuario'); //Importar modulo de rutas
const publicacionRoutes = require("./routes/publicacion");
const amigosRoutes = require("./routes/amigos");
const calendarioRoutes = require("./routes/calendario");

//SIEMPRE CD SERVER Y SI LUEGO ENCENDER

//middleware
app.use(cors());
app.use(express.json()); //req.body

//ROUTES//

// Rutas para usuarios
app.use('/usuarios', usuarioRoutes);

// Rutas para publicaciones
app.use('/publicaciones', publicacionRoutes);

// Rutas para amistadoes
app.use('/amistades', amigosRoutes);

//Rutas para eventos
app.use ('/calendario', calendarioRoutes);

app.listen(5000, () =>{
    console.log("Server started on port 5000");
})