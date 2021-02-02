const db = require('../db/mysql');
const express = require('express');
const router = express.Router();

router.get('/:gameId/:playerId/playerdata', async (req, res) => {
    const {gameId, playerId} = req.params;

    try {
        let gameData = await db.getGame(gameId);
        gameData = gameData[0];

        if (playerId === gameData.aPlayerId) res.json({player: "a"});
        else res.json({player: "b"});

    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

module.exports = router;