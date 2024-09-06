import { Request, Response } from "express";

export const getUsers = async (req: Request, res: Response) => {
    const params = req.query
    res.json({
        msg: 'get API- controlador'

    });
}
export const getUser = async (req: Request, res: Response) => {
    const params = req.query
    const { id } = req.params;

    res.json({
        msg: 'get by id API- controlador',
        id
    });
}
export const createUser = async (req: Request, res: Response) => {
    const body = req.body
    res.json({
        msg: 'Post API- controlador',
        body
    });
}
export const updateUser = async (req: Request, res: Response) => {
    const id = req.params.id
    res.json({
        msg: 'Put Api - controlador',
        id
    });
}

export const deleteUser = async (req: Request, res: Response) => {
    res.json({
        msg: 'Delete Patch- controlador'
    });

}


