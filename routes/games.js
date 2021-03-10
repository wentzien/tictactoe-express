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
        const nextGameId = uuidv4();

        // create game data in db
        let gameData = {
            gameId: gameId,
            gameCount: 0,
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
            nextGameId: nextGameId,
            starter: "b"
        };

        await db.setGame(gameData);

        // send game data to client
        res.send({gameId, playerId: aPlayerId});
    } catch (ex) {
        console.log(ex);
    }

});

module.exports = router;