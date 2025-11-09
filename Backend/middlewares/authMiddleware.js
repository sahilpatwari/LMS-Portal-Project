import jwt from "jsonwebtoken";
const authMiddleware=(req,res,next)=>{
    const authHeader=req.headers['authorization'];
    const token= authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({message:"Authorization Denied. No Token Found"});
    }
    
    try {
        const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET);

        req.user=decoded.user;
        next();
    }
    catch(err) {
        console.log(err);
        return res.status(401).json({message:"Invalid Token- Authorization Denied"});
    }
}

export default authMiddleware;