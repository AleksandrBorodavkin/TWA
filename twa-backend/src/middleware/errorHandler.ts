import { Request, Response, NextFunction } from 'express';

// Интерфейс для ошибок
interface CustomError extends Error {
    status?: number; // HTTP-статус ошибки
}

// Middleware для обработки ошибок
export const errorHandler = (
    err: CustomError,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Логируем ошибку (можно заменить на сторонний логгер)
    console.error(err);
    // console.log('был вызван errorHandler' , res.status(401));


    // Устанавливаем статус ответа (по умолчанию 500)
    const statusCode = err.name === 'Error' && err.message === 'Init data expired' ? 401 : 500;
    //
    // // Формируем JSON-ответ
    // res.status(statusCode).json({
    //     success: false,
    //     message: err.message || 'Internal Server Error',
    //     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    // });
};
