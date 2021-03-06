require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const passport = require('passport');
const path = require('path');

const app = express();

const server = require('http').Server(app);

const io = require('socket.io')(server);

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const userRouter = require('./routes/users')(io);
const channelRouter = require('./routes/channel')(io);

const commentRouter = require('./routes/comments')(io);

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', { session: false });

// Protected test endpoint
app.get('/api/protected', jwtAuth, (req, res) => {
    return res.json({ data: 'rosebud' });
});

// Route for user authentication when logging in
app.use('/api/users/login', authRouter);

// User route
app.use('/api/users', userRouter);

// Comment route
app.use('/api/comments', jwtAuth, commentRouter);

// Channel route
app.use('/api/channels', jwtAuth, channelRouter);

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } };
    } else {
        console.error(error);
        response = { message: error.message, error };
    }
    res.status(500).json(response);
});

//Serve Static Assets in production
//set static folder
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static('client/build'));
//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//     });
// }

// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
// });

module.exports = { app, server, io };
