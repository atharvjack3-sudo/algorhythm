import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import crypto from "crypto";
const router = express.Router();

router.post("/collab/create-room", authMiddleware, async (req, res) => {
    const { problemId } = req.body;
    const userId = req.user.id;
    let conn;
    try {
        conn = await db.connect();
        const { rows: problemRows } = await conn.query("SELECT id FROM problems WHERE id=$1", [problemId]);
        if (problemRows.length === 0) {
            return res.status(404).json({
                errorPresent: true,
                errorMsg: "Problem not found",
                roomCode: null
            });
        }
        const { rows: preExistenceRows } = await conn.query("SELECT room_code, ws_room_id FROM collab_rooms WHERE is_active=TRUE AND owner_id=$1 AND problem_id=$2", [userId,problemId]);
    
        if (preExistenceRows.length) {
            return res.status(200).json({
                errorPresent: true,
                errorMsg: "An active room already exists",
                roomCode: preExistenceRows[0].room_code,
                wsRoomId: preExistenceRows[0].ws_room_id,
            });
        }

        const charSet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let rcode = "";
        while (true) {
            for (let i = 0; i < 6; i++) rcode += charSet[crypto.randomInt(charSet.length)];
            const { rows: uniqueRow } = await conn.query("SELECT 1 FROM collab_rooms WHERE room_code=$1", [rcode]);
            if (uniqueRow.length === 0) break;
            rcode = "";
        }
        const wsRoomId = crypto.randomUUID();
        
        await conn.query("INSERT INTO collab_rooms (room_code, ws_room_id, owner_id, problem_id, is_active) VALUES ($1, $2, $3, $4, TRUE)", [rcode, wsRoomId, userId, problemId]);

        res.status(201).json({
            errorPresent: false,
            errorMsg: null,
            roomCode: rcode,
            wsRoomId: wsRoomId,
        });

    } 
    catch (err) {
        console.log(err);
        return res.status(500).json({
            errorPresent: true,
            errorMsg: "Internal Server Error",
            roomCode: null,
            wsRoomId: null,
        })
    }
    finally {
        if (conn) conn.release();
    }
    /*
    schema 
    collab_rooms
    ( id [pk], room_code, ws_room_id, owner_id, problem_id, is_active [bool], created_at )
    */
});

router.post("/collab/terminate-room", authMiddleware, async (req, res) => {
    const { roomCode } = req.body;
    const userId = req.user.id;
    let conn;
    try {
        conn = await db.connect();
        const { rows } = await conn.query("SELECT owner_id FROM collab_rooms WHERE room_code=$1 AND is_active=$2", [roomCode, true]);
        if (rows.length === 0) {
            return res.status(404).json({
                errorPresent: true,
                errorMsg: "Active room not found",
            });
        }
        if (rows[0].owner_id != userId) {
            return res.status(403).json({
                errorPresent: true,
                errorMsg: "Forbidden",
            });
        }
        await conn.query("UPDATE collab_rooms SET is_active=$1 WHERE room_code=$2", [false, roomCode]);
        return res.status(200).json({
            errorPresent: false,
            errorMsg: null,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            errorPresent: true,
            errorMsg: "Internal Server Error",
        }); 
    }
    finally {
        if (conn) conn.release();
    }
});

router.post("/collab/join-room", authMiddleware, async (req, res) => {
    const { roomCode, problemId } = req.body;
    let conn;
    try {
        conn = await db.connect();
        const { rows } = await conn.query("SELECT ws_room_id FROM collab_rooms WHERE is_active=$1 AND room_code=$2 AND problem_id=$3", [true, roomCode, problemId]);
        if (rows.length === 0) return res.status(404).json({
            errorPresent: true,
            errorMsg: "Active room for the problem is not found",
            roomCode: null,
            wsRoomId: null,
        });
        return res.status(200).json({
            errorPresent: false,
            errorMsg: null,
            roomCode: roomCode,
            wsRoomId: rows[0].ws_room_id,
        })

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            errorPresent: true,
            errorMsg: "Internal Server Error",
        });
    }
    finally {
        if (conn) conn.release();
    }
});

export default router;