const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    port: 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const db = {};

db.getGame = (gameId) => {

    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM games WHERE gameId = ?', gameId, (err, rows, fields) => {
            if (err) return reject(err);
            if(rows[0]) {
                let gameData = rows[0];
                gameData.board = JSON.parse(gameData.board);
                return resolve(gameData);
            } else {
                return resolve(null);
            }
        });
    });
};

db.setGame = (game) => {
    if(game.board) game.board = JSON.stringify(game.board);
    const fields = [
        game.gameId,
        game.aPlayerId,
        game.bPlayerId,
        game.board,
        game.aScore,
        game.bScore,
        game.gameStatus
    ];
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO games (gameId, aPlayerId, bPlayerId, board, aScore, bScore, gameStatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
            fields,
            (err, rows, fields) => {
                if (err) return reject(err);
                return resolve(rows);
            });
    });
};

db.updateGame = (game) => {
    if(game.board) game.board = JSON.stringify(game.board);
    const fields = [
        game.aPlayerId,
        game.bPlayerId,
        game.board,
        game.aScore,
        game.bScore,
        game.gameStatus,
        game.gameId
    ];

    return new Promise((resolve, reject) => {
        pool.query('UPDATE games SET aPlayerId = ?, bPlayerId = ?, board = ?, aScore = ?, bScore = ?, gameStatus = ? WHERE gameId = ?', fields,
            (err, rows, fields) => {
                if (err) return reject(err);
                return resolve(rows);
            });
    });
}

module.exports = db;