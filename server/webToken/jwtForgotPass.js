const jwt = require('jsonwebtoken');
const {config} = require('dotenv') //Para ocultar credenciales
config(); 


function jwtGeneratorPass(email){
    const payload = {
        correo: email,
    }

    return jwt.sign(payload, process.env.jwtSecret2, {expiresIn: "15m"})
}

module.exports = jwtGeneratorPass