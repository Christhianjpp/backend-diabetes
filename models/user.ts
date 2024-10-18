import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user';


const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
        },
        userName: {
            type: String,
            required: [true, 'User name is required'],
            unique: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        img: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
            required: false,
        },
        rol: {
            type: String,
            default: 'PATIENT_ROLE',
            enum: ['ADMIN_ROLE', 'DOCTOR_ROLE', 'PATIENT_ROLE', 'USER_ROLE'],
        },
        state: {
            type: Boolean,
            default: true,
        },
        google: {
            type: Boolean,
            default: false,
        },
        postSaved: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Post',
            },
        ],
        blockedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        usersSaved: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        lastConnection: {
            type: Date,
            default: Date.now,
        },
        notifications: [
            {
                typeNotification: {
                    type: String,
                    enum: ['message', 'alert', 'reminder'],
                    required: true,
                },
                message: {
                    type: String,
                },
                read: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        violations: {
            type: Number,
            default: 0,
        },
        // Campos relacionados a la salud para pacientes diabéticos, opcionales
        healthInfo: {
            diabetesType: {
                type: String,
                enum: ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otra'],
                default: null,
            },
            lastHbA1c: {
                type: Number,
                min: 0,
                max: 14,
                default: null,
            },
            medications: [
                {
                    name: { type: String },
                    dose: { type: String },
                    frequency: { type: String },
                },
            ],
            diagnosisDate: {
                type: Date,
                default: null,
            },
        },
        // Geolocalización
        location: {
            type: {
                type: String,
                enum: ['Point'], // Definimos que es un punto
                default: 'Point',
            },
            coordinates: {
                type: [Number], // Array [longitud, latitud]
                default: [0, 0],
            },
        },
        // Referencia a formulario, opcional
        formRef: {
            type: Schema.Types.ObjectId,
            ref: 'Form',
            default: null,
        },
        // Referencia a chats
        chats: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Chat',
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Método para ocultar contraseña y otros campos en la respuesta
UserSchema.methods.toJSON = function () {
    const { __v, password, _id, ...user } = this.toObject();
    user.uid = _id;
    return user;
};

export default model('User', UserSchema);