//para paginas que requieren que se haya iniciado sesion 
const jwt = require("jsonwebtoken");

const {config} = require('dotenv') //Para ocultar credenciales
config(); //cargar valores de .env

module.exports = async (req,res,next) => {


    try {
        const jwtToken = req.header("token");
        console.log(jwtToken)
        //verificar que hay token
        if(!jwtToken){
            return res.status(403).json("No estas autorizado, no hay token");
        }


        //verificar que si sea el token
        const payload = jwt.verify(jwtToken, process.env.jwtSecret);
    
        //Tras pasar el Middleware el req.correo de la peticion tendra el payload, en este caso corresponde al correo
        req.correo = payload.correo;
        req.nombre = payload.nombre;
        next()
        
    } catch (error) {
        console.error(error.message); 
        //Por alguna razon no muestra el json con el mensaje esto es en la primera renderizacion
        return res.status(401).json("Token No Valido, No estas autorizado");
    }
};