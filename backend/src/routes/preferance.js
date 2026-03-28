import express from "express"

const router = express.Router()

router.post("/", (req, res) => {
    res.json({ message: "At preferance route " })
})

export default router
