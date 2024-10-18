

import { Document, Types } from 'mongoose';

export interface IHealthInfo {
    diabetesType?: 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'Otra';
    lastHbA1c?: number;
    medications?: Array<{
        name?: string;
        dose?: string;
        frequency?: string;
    }>;
    diagnosisDate?: Date;
}

export interface IUser extends Document {
    name: string;
    userName: string;
    email: string;
    password: string;
    dateOfBirth?: Date;
    img?: string;
    rol: 'ADMIN_ROLE' | 'DOCTOR_ROLE' | 'PATIENT_ROLE' | 'USER_ROLE';
    state: boolean;
    google: boolean;
    postSaved: [Types.ObjectId];
    blockedBy: [Types.ObjectId];
    usersSaved: [Types.ObjectId];
    lastConnection: Date;
    notifications: Array<{
        typeNotification: 'message' | 'alert' | 'reminder';
        message?: string;
        read: boolean;
    }>;
    violations: number;
    healthInfo?: IHealthInfo;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    formRef?: Types.ObjectId;
    chats: [Types.ObjectId];
}
