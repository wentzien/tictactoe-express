require('dotenv').config();
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const app = express();

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const gamesRouter = require("./routes/games");
const db = require("./db/mysql");

app.use(cors());
app.use(express.json());

app.use("/games", gamesRouter);

io.on("connection", (socket) => {
    console.log("new connection");

    socket.on("join", async (game, answer) => {
        let player;
        let gameData = await db.getGame(game.gameId);

        if (gameData === null) {
            // new game
            console.log("new game, player a joining");
            gameData = {
                gameId: game.gameId,
                aPlayerId: game.playerId,
                board: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ],
                aScore: 0,
                bScore: 0,
                gameStatus: "pending",
            };

            await db.setGame(gameData);
        } else {
            // game is already been created
            // if playerId for b is missing

            if (game.playerId !== gameData.aPlayerId && gameData.bPlayerId == null) {
                console.log("existing game, player b joining");
                gameData.bPlayerId = game.playerId;
                gameData.gameStatus = "bTurn";
                await db.updateGame(gameData);
            }
        }

        socket.join(game.gameId);

        if (game.playerId === gameData.aPlayerId) player = "a";
        else player = "b";
        answer({player});

        gameData = await db.getGame(game.gameId);

        io.to(game.gameId).emit("gameData", gameData);
    });

    socket.on("gameProgress", async (game) => {
        // Status:
        // aTurn: A ist an der Reihe
        // bTurn: B ist an der Reihe
        // aWon: A hat gewonnen
        // bWon: B hat gewonnen
        // draw: unentschieden
        // pending: falls Server noch keine Daten geschickt hat

        let gameData = await db.getGame(game.gameId);

        for(item in game) {
                gameData[item] = game[item];
        }

        const aWon = hasWon(gameData.board, "a");
        const bWon = hasWon(gameData.board, "b");
        const draw = checkDraw(gameData.board);

        if(aWon) gameData.gameStatus = "aWon"
        else if (bWon) gameData.gameStatus = "bWon"
        else if (draw) gameData.gameStatus = "draw"
        else {
            if(gameData.gameStatus === "bTurn") gameData.gameStatus = "aTurn"
            else gameData.gameStatus = "bTurn"
        }

        const result = await db.updateGame(gameData);

        gameData = await db.getGame(game.gameId);

        io.to(game.gameId).emit("gameData", gameData);
    });

    socket.on("disconnect", () => {
        console.log("user left");
    });
});

// app.use("/questions", questionRouter);
// app.use("/events", eventRouter);

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