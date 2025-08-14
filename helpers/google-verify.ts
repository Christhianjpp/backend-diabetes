import { OAuth2Client } from "google-auth-library";
import { GoogleUser } from "../interfaces/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleVerify(idToken: any) {
 
  try {
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
      // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
   
    const { name, picture, email } = <GoogleUser>ticket.getPayload();
    
    return {
      name,
      img: picture,
      email,
    };
  } catch (error) {
    console.log("error", error)
    throw new Error("Error al verificar el token de Google")
  }
}

export default googleVerify;
