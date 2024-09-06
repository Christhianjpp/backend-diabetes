import express, { Application } from 'express'
import cors from 'cors'
import userRouter from '../routes/users'

class Server {
    private app: Application;
    private port: string;
    private apiPaths = {
        users: '/api/users'
    }

    constructor() {
        this.app = express()
        this.port = process.env.PORT || '8080'
        this.middlewares()
        this.router()
    }
    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'))
    }

    router() {
        this.app.use(this.apiPaths.users, userRouter)
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`)
        })
    }

}

export default Server