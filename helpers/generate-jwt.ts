import { sign } from 'jsonwebtoken'

const generatJWT = (uid = '') => {

    return new Promise((resolve, reject) => {

        const payload = { uid }

        sign(payload, `${process.env.SECRETORPRIVATEKEY}`, (err, token) => {
            if (err) {
                console.log(err);
                reject('canno generate a token')
            } else {
                resolve(token)
            }
        })

    })

}


export default generatJWT



// {
//     expiresIn: '4h'
// },