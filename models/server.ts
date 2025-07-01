import express, { Application } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import dbConnection from "../database/config";
import userRouter from "../routes/users";
import userAuth from "../routes/auth";
import userUploads from "../routes/uploads";
import notificationPush from "../routes/notification-push";

class Server {
  private app: Application;
  private port: string;
  private apiPaths = {
    users: "/api/users",
    auth: "/api/auth",
    uploads: "/api/uploads",
    notifications: "/api/notification-push",
  };

  constructor() {
    this.app = express();
    this.port = process.env.PORT || "8080";
    this.dbConnection();
    this.middlewares();
    this.router();
  }
  async dbConnection() {
    await dbConnection();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static("public"));

    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        createParentPath: true,
      })
    );
  }

  router() {
    this.app.use(this.apiPaths.users, userRouter);
    this.app.use(this.apiPaths.auth, userAuth);
    this.app.use(this.apiPaths.uploads, userUploads);
    this.app.use(this.apiPaths.notifications, notificationPush);
  }
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

export default Server;
