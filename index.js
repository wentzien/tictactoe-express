require('dotenv').config();
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const app = express();

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.static("public"));

const gamesRouter = require("./routes/games");
const db = require("./db/mysql");

app.use(cors());
app.use(express.json());

app.use("/api/games", gamesRouter);

io.on("connection", (socket) => {
    console.log("new connection");

    socket.on("join", async (game, answer) => {
        // objekt mit playerId & gameId
        const {gameId, playerId} = game;


        if (gameId && playerId) {
            let gameData = await db.getGame(gameId);
            const {aPlayerId, bPlayerId} = gameData;

            if (playerId === aPlayerId || playerId === bPlayerId) {
                socket.join(gameId);

                io.to(gameId).emit("gameData", gameData);
            }
        }
    });

    socket.on("gameProgress", async (game) => {
        // objekt mit playerId & gameId & neues Board
        const {playerId, gameId, board: newBoard} = game;

        // Status:
        // aTurn: A ist an der Reihe
        // bTurn: B ist an der Reihe
        // aWon: A hat gewonnen
        // bWon: B hat gewonnen
        // draw: unentschieden
        // pending: falls Server noch keine Daten geschickt hat
        // waiting: for other player

        if (gameId && playerId) {
            let gameData = await db.getGame(gameId);
            const {aPlayerId, bPlayerId, board: oldBoard, gameStatus} = gameData;

            if ((gameStatus !== "aWon" || gameStatus !== "bWon" || gameStatus !== "draw")
                && ((playerId === aPlayerId && gameStatus === "aTurn" && checkMove(oldBoard, newBoard, "a")
                    || (playerId === bPlayerId && gameStatus === "bTurn" && checkMove(oldBoard, newBoard, "b"))))) {

                const aWon = hasWon(newBoard, "a");
                const bWon = hasWon(newBoard, "b");
                const draw = checkDraw(newBoard);

                if (aWon) {
                    gameData.gameStatus = "aWon";
                } else if (bWon) {
                    gameData.gameStatus = "bWon";
                } else if (draw) {
                    gameData.gameStatus = "draw";
                } else {
                    // anderer Spieler ist am Zug
                    gameData.gameStatus = gameData.gameStatus === "aTurn" ? "bTurn" : "aTurn";
                }

                gameData.board = newBoard;
                await db.updateGame(gameData);
            }
            gameData = await db.getGame(gameId);

            io.to(gameId).emit("gameData", gameData);
        }
    });

    socket.on("disconnect", () => {
        console.log("user left");
    });
});

// Port
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`App listening on port ${port}...)`));


//helper functions
function hasWon(board, player) {
    for (let i = 0; i <= 2; i++) {
        // Horizontal
        if (board[i][0] === player && board[i][1] === player && board[i][2] === player)
            return true;
        // Vertical
        if (board[0][i] === player && board[1][i] === player && board[2][i] === player)
            return true;
    }
    // Diagonal
    if (board[0][0] === player && board[1][1] === player && board[2][2] === player)
        return true;
    // Counter Diagonal
    if (board[2][0] === player && board[1][1] === player && board[0][2] === player)
        return true;
    return false;
}

function checkDraw(board) {
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= 2; j++) {
            if (board[i][j] === 0) {
                return false;
            }
        }
    }
    return true;
}

function checkMove(oldBoard, newBoard, player) {
    let countDiff = 0;
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            if (oldBoard[x][y] !== newBoard[x][y]) {
                if (newBoard[x][y] === player) {
                    countDiff++;
                } else {
                    return false;
                }
            }
        }
    }
    return countDiff === 1;
}