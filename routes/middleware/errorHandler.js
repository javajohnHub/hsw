"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        statusCode = 500;
        message = 'Database Error';
    }
    res.status(statusCode).json({
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
