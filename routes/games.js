const db = require('../db/mysql');
const express = require('express');
const router = express.Router();
// import {v4 as uuidv4} from "uuid";
const {v4: uuidv4} = require("uuid");

router.get("/", async (req, res) => {
    try {
        const gameId = uuidv4();
        const aPlayerId = uuidv4();
        const bPlayerId = uuidv4();

        // create game data in db
        let gameData = {
            gameId: gameId,
            aPlayerId: aPlayerId,
            bPlayerId: bPlayerId,
            board: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            aScore: 0,
            bScore: 0,
            gameStatus: "bTurn",
        };

        await db.setGame(gameData);

        // Status:
        // aTurn: A ist an der Reihe
        // bTurn: B ist an der Reihe
        // aWon: A hat gewonnen
        // bWon: B hat gewonnen
        // draw: unentschieden
        // pending: falls Server noch keine Daten geschickt hat
        // waiting: for other player

        // send game data to client
        res.send(gameData);
    } catch (ex) {
        console.log(ex);
    }

});

module.exports = router;