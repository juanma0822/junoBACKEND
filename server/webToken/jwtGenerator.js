const jwt = require('jsonwebtoken');
const {config} = require('dotenv') //Para ocultar credenciales
config(); 

function jwtGenerator(email,nom){
    const payload = {
        correo: email,
        nombre: nom
    }

    return jwt.sign(payload, process.env.jwtSecret, {expiresIn: "1h"})
}

module.exports = jwtGenerator