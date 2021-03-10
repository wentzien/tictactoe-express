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

db.getLatestGame = (gameId) => {

    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM games WHERE gameId = ? ORDER BY gameCount DESC', gameId, (err, rows, fields) => {
            if (err) return reject(err);
            if (rows[0]) {
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
    if (game.board) game.board = JSON.stringify(game.board);
    const fields = [
        game.gameId,
        game.gameCount,
        game.aPlayerId,
        game.bPlayerId,
        game.board,
        game.aScore,
        game.bScore,
        game.gameStatus,
        game.starter
    ];
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO games (gameId, gameCount, aPlayerId, bPlayerId, board, aScore,' +
            ' bScore,' +
            ' gameStatus, starter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            fields,
            (err, rows, fields) => {
                if (err) return reject(err);
                return resolve(rows);
            });
    });
};

db.updateGame = (game) => {
    if (game.board) game.board = JSON.stringify(game.board);
    const fields = [
        game.board,
        game.aScore,
        game.bScore,
        game.gameStatus,
        game.gameId,
        game.gameCount
    ];

    return new Promise((resolve, reject) => {
        pool.query('UPDATE games SET board = ?, aScore = ?, bScore = ?, gameStatus = ? WHERE' +
            ' gameId = ? AND gameCount = ?', fields,
            (err, rows, fields) => {
                if (err) return reject(err);
                return resolve(rows);
            });
    });
}

module.exports = db;