"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("../database/config"));
const users_1 = __importDefault(require("../routes/users"));
const auth_1 = __importDefault(require("../routes/auth"));
const uploads_1 = __importDefault(require("../routes/uploads"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
class Server {
    constructor() {
        this.apiPaths = {
            users: "/api/users",
            auth: "/api/auth",
            uploads: "/api/uploads",
        };
        this.app = (0, express_1.default)();
        this.port = process.env.PORT || "8080";
        this.dbConnection();
        this.middlewares();
        this.router();
    }
    dbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, config_1.default)();
        });
    }
    middlewares() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static("public"));
        this.app.use((0, express_fileupload_1.default)({
            useTempFiles: true,
            tempFileDir: "/tmp/",
            createParentPath: true,
        }));
    }
    router() {
        this.app.use(this.apiPaths.users, users_1.default);
        this.app.use(this.apiPaths.auth, auth_1.default);
        this.app.use(this.apiPaths.uploads, uploads_1.default);
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map