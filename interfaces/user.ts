import { Document, Types } from "mongoose";

export interface IHealthInfo {
  diabetesType?: "Tipo 1" | "Tipo 2" | "Gestacional" | "Otra";
  lastHbA1c?: number;
  medications?: Array<{
    name?: string;
    dose?: string;
    frequency?: string;
  }>;
  diagnosisDate?: Date;
}

export interface IAddress {
  city?: string;
  country?: string;
  stateProvince?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface IUser extends Document {
  uid: string;
  name: string;
  userName: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  height?: number;
  weight?: number;
  address?: IAddress;
  phone?: string;
  email: string;
  password: string;
  img?: string;
  rol: "ADMIN_ROLE" | "DOCTOR_ROLE" | "PATIENT_ROLE" | "USER_ROLE";
  state: boolean;
  google: boolean;
  pushTokens?: Array<{
    token: string;
    device?: string;
    createdAt?: Date;
  }>;
  postSaved: [Types.ObjectId];
  blockedBy: [Types.ObjectId];
  usersSaved: [Types.ObjectId];
  lastConnection: Date;
  notifications: Array<{
    typeNotification: "message" | "alert" | "reminder";
    message?: string;
    read: boolean;
  }>;
  violations: number;
  formRef?: Types.ObjectId;
  chats: [Types.ObjectId];
  healthInfo?: IHealthInfo;
}
