import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/cloud-saves", authMiddleware, async (req, res) => {
    const { problemId, title, code, language } = req.body;
    const userId = req.user.id;
    let conn;
    
    try {
        conn = await db.connect();
        
        if (!problemId || !title || !code || !language) {
            return res.status(400).json({
                errorPresent: true,
                errorMsg: "Missing required fields (problemId, title, code, language)",
                saveId: null
            });
        }

        const insertQuery = `
            INSERT INTO cloud_saves (user_id, problem_id, title, code, language) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, created_at
        `;
        
        const { rows } = await conn.query(insertQuery, [userId, problemId, title, code, language]);

        return res.status(201).json({
            errorPresent: false,
            errorMsg: null,
            save: rows[0]
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            errorPresent: true,
            errorMsg: "Internal Server Error",
            save: null
        });
    } finally {
        if (conn) conn.release();
    }
});

router.get("/cloud-saves/:problemId", authMiddleware, async (req, res) => {
    const { problemId } = req.params;
    const userId = req.user.id;
    let conn;
    
    try {
        conn = await db.connect();
        
        const fetchQuery = `
            SELECT id, title, code, language, created_at 
            FROM cloud_saves 
            WHERE user_id = $1 AND problem_id = $2 
            ORDER BY created_at DESC
        `;
        
        const { rows } = await conn.query(fetchQuery, [userId, problemId]);

        return res.status(200).json({
            errorPresent: false,
            errorMsg: null,
            saves: rows
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            errorPresent: true,
            errorMsg: "Internal Server Error",
            saves: null
        });
    } finally {
        if (conn) conn.release();
    }
});

export default router;