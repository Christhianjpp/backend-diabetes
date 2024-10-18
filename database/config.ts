import mongoose from 'mongoose'

const dbConnection = async () => {

    try {
        await mongoose.connect(`${process.env.MONGODB_CNN}`)
        console.log('DB online - Mongoose')

    } catch (error) {
        console.log(error)
        throw new Error('Error starting DB')
    }

}

export default dbConnection