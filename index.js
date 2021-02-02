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

const db = require("./db/mysql");

// const questionRouter = require("./routes/questions");
// const eventRouter = require("./routes/events");

app.use(cors());

app.use(express.json());

io.on("connection", (socket) => {
    console.log("new connection");

    socket.on("join", async (game, answer) => {
        // gameId, aPlayerId, bPlayerId

        let gameData = await db.getGame(game.gameId);

        if (!(gameData = gameData[0])) {
            // new game
            console.log("new game, player a joining");
            gameData = {
                gameId: game.gameId,
                aPlayerId: game.playerId,
                board: JSON.stringify([
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ]),
                aScore: 0,
                bScore: 0,
                gameStatus: "pending",
            };

            await db.setGame(gameData);
        } else {
            // game is already been created
            // if playerId for b is missing

            if (game.playerId !== gameData.aPlayerId && gameData.bPlayerId == null) {
                console.log("existing game, player b joining")
                gameData.bPlayerId = game.playerId;
                gameData.gameStatus = "bTurn";
                await db.updateGame(gameData);
            }
        }

        if (game.playerId === gameData.aPlayerId) gameData.player = "a"
        else gameData.player = "b"

        socket.join(game.gameId);
        answer("joined the game");

        io.to(game.gameId).emit("gameData", gameData);
    });

    socket.on("gameProgress", async (game) => {

        // Veränderung
        // board als JSON

        // Status:
        // aTurn: A ist an der Reihe
        // bTurn: B ist an der Reihe
        // aWon: A hat gewonnen
        // bWon: B hat gewonnen
        // draw: unentschieden
        // pending: falls Server noch keine Daten geschickt hat

        const result = await db.updateGame(game);

        const gameData = await db.getGame(game.gameId);

        io.to(game.gameId).emit("board", gameData);
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
