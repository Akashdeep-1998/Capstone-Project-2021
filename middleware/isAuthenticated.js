module.exports=(req,res,next)=>{
    if(!req.session.isLoggedIn)
    {
        return res.render('403-forbidden');
    }
    next();
}