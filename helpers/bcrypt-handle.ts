import { genSaltSync, compareSync, hashSync } from 'bcryptjs'


const encrypt = (password: string) => {
    const salt = genSaltSync(10);
    return hashSync(password, salt)
}

const verfied = (password: string, dbPassword: string) => {
    return compareSync(password, dbPassword)
}



export {
    encrypt,
    verfied,

}