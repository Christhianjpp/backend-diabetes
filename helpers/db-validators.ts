import User from "../models/user";

// Check User
const userNameExists = async (userName = "") => {
  const regex = new RegExp(userName, "i");
  const userNameExists = await User.findOne({ userName: regex });
  if (userNameExists) {
    throw new Error(`El usuario: ${userName} ya existe`);
  }
};
const emailExists = async (email = "") => {
  console.log(email);

  const regex = new RegExp(email, "i");
  const existsEmail = await User.findOne({ email: regex });
  if (existsEmail) {
    throw new Error(`El correo: ${email} ya existe`);
  }
};

const userExists = async (id = "") => {
  const existsUser = await User.findById(id);
  if (!existsUser) {
    throw new Error(`the User: ${id} does no exist`);
  }
};

// Validar colecciones permitidas
const coleccionesPermitidas = (coleccion = "", colecciones = [""]) => {
  const incluida = colecciones.includes(coleccion);
  if (!incluida) {
    throw new Error(
      `La colección ${coleccion} no es permitida - ${colecciones}`
    );
  }
  return true;
};

export { emailExists, userExists, coleccionesPermitidas, userNameExists };
