import { Response } from "express";

const handleError = (res: Response, error: string, errorRAW?: any) => {
    console.log({ errorRAW })
    res.status(500).json({
        error
    })
}

export default handleError