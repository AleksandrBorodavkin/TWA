import { validate, parse } from '@telegram-apps/init-data-node';
import express, {
    type ErrorRequestHandler,
    type RequestHandler,
    type Response,
} from 'express';

require('dotenv').config()

/**
 * Sets init data in the specified Response object.
 * @param res - Response object.
 * @param initData - init data.
 */
function setInitData(res: Response, initData: any): void {
    res.locals.initData = initData;
}

/**
 * Extracts init data from the Response object.
 * @param res - Response object.
 * @returns Init data stored in the Response object. Can return undefined in case,
 * the client is not authorized.
 */
export function getInitData(res: Response): any | undefined {
    // console.log('res.locals.initData---------------------------------------------------', res.locals.initData)
    return res.locals.initData;
}

/**
 * Middleware which authorizes the external client.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - function to call the next middleware.
 */
export const authMiddleware: RequestHandler = (req, res, next) => {
    // We expect passing init data in the Authorization header in the following format:
    // <auth-type> <auth-data>
    // <auth-type> must be "tma", and <auth-data> is Telegram Mini Apps init data.
    const [authType, authData = ''] = (req.header('authorization') || '').split(' ');

    switch (authType) {
        case 'tma':
            try {
                // #TODO при ошибке валидации express.js падает я не справился, оставляю на потом
                // Validate init data.
                validate(authData, process.env.BOT_TOKEN!, {
                    // We consider init data sign valid for 1 hour from their creation moment.
                    expiresIn: 3600,
                });
                // Parse init data. We will surely need it in the future.
                setInitData(res, parse(authData));
                next();
            } catch (e) {
                next(e);
            }
            break;
        // ... other authorization methods.
        default:
            return next(new Error('Unauthorized'));
    }
};

/**
 * Middleware which shows the user init data.
 * @param _req
 * @param res - Response object.
 * @param next - function to call the next middleware.
 */

export default { authMiddleware, getInitData };
