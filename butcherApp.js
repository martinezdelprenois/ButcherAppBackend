
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port = 7200;
var jwt = require('jsonwebtoken');
var secretkey = 'bobsdfljsdfsdjfk23432dsf@fdskfsdlfklsk4345lfldkflkdjfldkjfjsdlfjlsdjflsknvneekelllelklvksvlksflskdflksflksflskflskksflsdcat';

//var db = 'mongodb://localhost:27017/butcher';

var db = 'mongodb://matt:#2547j@127.0.0.1:27017/butcher';

var cors = require('cors');
var methodOverride = require('method-override');
var morgan = require('morgan');
var fs = require('fs-extra');
var multer = require('multer');
var path = require('path');
var timestamp = new Date().getTime().toString();



//IMPORTING THE MODELS
var User = require('./usersModel');
var Feedback = require('./feedbackModel');
var Product = require('./productsModel');
var Category = require('./categoryModel');
var Order = require('./orderModel');
var DelOrder = require('./deliveredOrders');
var CancelOrder = require('./cancelOrderModel');
var Promotion = require('./promotionsModel');
var Hams = require('./hampersModel');

mongoose.Promise = global.Promise; 
mongoose.connect(db, { useMongoClient: true });

// dealing with the connection just right below 
var dbs = mongoose.connection;
 dbs.on('error', console.error.bind(console, 'connection error:'));
 dbs.once('open', function(){
 	console.log('successfully connected');
 });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('dev'));
app.use(methodOverride());
app.use(cors());
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Expose-Headers', 'X-Requested-With,content-type, Authorization, access_token');
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, POST, GET');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

   next();
});





// for the variable tokens

var user_token;

app.get('/', (req,res)=>{
	res.send('happy buying meat guys');
});

// POST BELOW IS FOR SIGNIN UP THE NEW USER
app.post('/api/userSignup', (req,res)=>{

    var userSignup = new User();
    userSignup.fname = req.body.fname;
    userSignup.lname = req.body.lname;
    userSignup.email = req.body.email;
    userSignup.area = req.body.area;
    userSignup.tell = req.body.tell;
    userSignup.password = req.body.password;

    User.findOne({email: req.body.email}, (err,found)=>{
        if(err){
            res.json({
                failed: true
            });
        } else if(found){
            res.json({
                emailExists:true
            });
        } else if (!found){

            userSignup.save((err,saved)=>{
                if(err){
                    res.json({
                       message:'failed to signup',
                       failed:true 
                    });
                } else {
                    var id = saved._id;
        
                    jwt.sign({id},secretkey, (err,successful)=>{
                        if(err){
                            res.json({
                                message: 'failed to signup',
                                failed:true
                            });
                        } else {
                            res.json({
                                failed:false,
                                Token: successful
                            });
                        }
                    });
                }
            });
            
        }
    });

});

// POST BELOW IS FOR SIGNING UP A USER
app.post('/api/login', (req,res)=>{

    if(!req.body.email || !req.body.password){
        res.json({
            message: 'please sign in with an email and password',
            failed:true
        });
    } else {
        User.findOne({email:req.body.email}, (err,found)=>{

            if(err){
                res.json({
                    failed:true,
                    message: 'couldnot access database'
                });
               
            } else if (!found) {
                res.json({
                    Found:false,
                    message: 'this email doesnot exist'
                });
            } else {
                found.comparePassword(req.body.password, function(err, isMatch){
            
                    if(isMatch && !err){
                    
                    id = found._id;
                    
                        jwt.sign({id}, secretkey,(err, token)=>{
                          res.json({
                    
                              Token: token,
                            Found : true
                          });
                    
                        });
                    
                    
                    
                    
                    }
                    
                    else{
                        res.json({
                            passMatch: false,
                            message: 'wrong password'
                        });
                    }
                    
                    });
            }
        });
    }

});


// GET THE USER DETAILS BELOW
app.get('/api/userDetails', (req,res)=>{

    var headerexists = req.headers.authorization;
   
    if(!headerexists){
       
        res.json({
            failed:true
        });
     } else {
         var token = headerexists.split(' ')[1];

         jwt.verify(token, secretkey, (err,suc)=>{
             if(err){

               
                 res.json({
                    failed:true
                 });
             } else {
                 var ID = suc.id;
                 User.findById({_id:ID},'-__v -joined -password -_id', (err,found)=>{
                     if(err){

                        
                        console.log('could not be found');
                         res.json({
                             failed: true
                         });
                     } else {
                         res.json({
                             failed:false,
                             details:found
                         });
                     }
                 });
             }
         });
     }
});

// UPDATE USER DETAILS BELOW
app.post('/api/userUpdate', (req,res)=>{

   var headerExists = req.headers.authorization;

   if(!headerExists){
       res.json({
           updated: false
       });
   } else if (headerExists){
       var token = headerExists.split(' ')[1];

       jwt.verify(token,secretkey, (err,suc)=>{
           if(err){
               res.json({
                   updated:false
               });
           } else {

            var ID = suc.id;

            User.findById({_id:ID},(err,found)=>{
                if(err){
                    res.json({
                        updated: false
                    });
                } else if (found){
                    found.comparePassword(req.body.password, function(err, isMatch){
            
                        if(isMatch && !err){
                       

                        if(req.body.email === found.email && req.body.number === found.tell){
                            res.json({
                                updated:false,
                                message:'nothing to update'
                            });
                        } else if (req.body.email !== found.email && req.body.number === found.tell){

            User.findByIdAndUpdate({_id:ID,},{$set:{email:req.body.email}}, {new:true},(err,updated)=>{
                if(err){
                    res.json({
                        updated:false,

                    });
                } else if(updated) {
                    res.json({
                        updated: true
                    })
                }
            });
                        }
        else if (req.body.email === found.email && req.body.number !== found.tell){
            
            User.findByIdAndUpdate({_id:ID,},{$set:{tell:req.body.number}}, {new:true},(err,updated)=>{
                if(err){
                    res.json({
                        updated:false,

                    });
                } else if(updated) {
                    res.json({
                        updated: true
                    })
                }
            });
        }     
        
        else if (req.body.email !== found.email && req.body.number !== found.tell){
            User.findByIdAndUpdate({_id:ID,},{$set:{tell:req.body.number, email:req.body.email}}, {new:true},(err,updated)=>{
                if(err){
                    res.json({
                        updated:false,

                    });
                } else if(updated) {
                    res.json({
                        updated: true
                    })
                }
            });
        }
                        
                        }
                        
                        else{
                            res.json({
                                updated: false,
                                message: 'password mismatch'
                            });
                        }
                        
                        });
                }
            });
              
           }
       })
   }
})

// POST BELOW IS FOR COLLECTING FEEDBACK
app.post('/api/feedback', (req,res)=>{

    var headerexists = req.headers.authorization;

    if(!headerexists){
        res.json({
            message: 'please signup or login into the application',
            failed:true
        });
    } else {
        var toks = headerexists.split(' ')[1];
        
        jwt.verify(toks, secretkey, (err,verified)=>{
            if(err){

                res.json({
                    message:'couldnot sign in',
                    failed:true
                });
               
            } else {
                var id = verified.id;

                var feedbackAdd = new Feedback();
                feedbackAdd.user = id;
                feedbackAdd.message = req.body.message;

                feedbackAdd.save((err,saved)=>{
                    if(err){

                        res.json({
                            failed:true,
                        message: 'couldnot send feedback'
                        });
                        
                    } else {
                        res.json({
                            message:'feedback sent. Thank you',
                            failed: false
                        });
                    }
                });
                
            }
        });
    }
});



// GETTING THE PRODUCT CATEGORIES BELOW
app.get('/api/getCategories', (req,res)=>{
    Category.find({},'-__v -products -_id -date').lean().exec( (err,found)=>{
        if(err){
            res.json({
                finding:false
            });
        } else {
            res.json({
                finding: true,
                data: found
            });
        }
    });
});

// GET THE PRODUCTS
app.get('/api/getProducts', (req,res)=>{
    Category.find({}).populate('products', '-__v').lean().exec( (err,found)=>{
        if(err){
            res.json({
                finding:false
            });
        } else {
            res.json({
                finding: true,
                data: found
            });
        }
    });
});



// ORDERS 

app.post('/api/order', (req,res)=>{
var headerexists = req.headers.authorization;

if(!headerexists){
res.json({
    success: false
});
} else if (headerexists){
var token = headerexists.split(' ')[1];

jwt.verify(token, secretkey, (err,suc)=>{
    if(err){
        res.json({
            success: false
        });
    } else{


        var ID = suc.id;

     var newOrder = new Order();
     newOrder.user = ID;
     newOrder.total = req.body.total;
     newOrder.delFee = req.body.delFee;
        newOrder.product.push(req.body.items);
        newOrder.prices.push(req.body.prices);
        newOrder.qty.push(req.body.qty);
     newOrder.save((err,saved)=>{
         if(err){
             res.json({
                 success: false
             });
         } else {
             res.json({
                 success:true
             });

// HERE WE GO WITH THE MESSAGE
User.findById({_id:ID}, (err,found)=>{
    if(err){
        
    } else {
        console.log('order came for', req.body.qty, 'kgs for', req.body.items, 'at',
        req.body.prices, 'respectively, ordered by', found.fname, 'with number', found.area+found.tell );
    }
})


         }
     });
    }
});
}
});


// CHECK FOR PENDING ORDERS
app.get('/api/getPending', (req,res)=>{

    var headerexists = req.headers.authorization;

    if(!headerexists){
        res.json({
            got:false
        });
    } else if (headerexists){
        var token = headerexists.split(' ')[1];

        jwt.verify(token, secretkey, (err,tok)=>{
            if(err){
                res.json({
                    got: false
                });
            } else {
             
                var ID = tok.id;

                Order.find({user: ID}, (err,found)=>{
                    if(err){
                        res.json({
                            finding: false
                        });
                    } else if(found) {
                       
                 
                            res.json({
                                finding:true,
                                data: found
                            });
                     

                    } else if(!found){
                        res.json({
                            finding: false
                        });
                    }
                });

            }
        });
    }
});


// CONFIRMING DELIVERED
app.put('/api/confirmdelivered/:id', (req,res)=>{


                var ID = req.params.id;

                Order.findByIdAndRemove({_id:ID},(err,found)=>{

                    if(err){
                        console.log(err);
                        res.json({
                            updated: false
                        });
                    } else if (found){
                    
                    var newDel =new DelOrder();

                    newDel.product.push(found.product);
                    newDel.prices.push(found.prices);
                    newDel.qty.push(found.qty);
                    newDel.total = found.total;
                    newDel.delFee = found.delFee;
                    newDel.user = found.user;


                    newDel.save((err,saved)=>{
                        if(err){

                          
                            res.json({
                                updated: false
                            });
                        } else if (saved){

                            res.json({
                                updated: true
                            });
                        }
                    });

             
                    }
                });
            
       
    

});

// CANCEL THE ORDER
/*app.post('/api/ordercancel', (req,res)=>{

    var headerexists = req.headers.authorization;

    if(!headerexists){
        res.json({
            cancel : false
        });
    } else if (headerexists){

        var token = headerexists.split(' ')[1];

        jwt.verify(token,secretkey, (err,suc)=>{
            if(err){
                res.json({

                    cancel: false
                });
            } else if (suc){

                var ID = suc.id;

                Order.findOneAndRemove({user:ID}, (err,found)=>{
                    if(err){
                        res.json({
                            cancel :false
                        });
                    } else if (found){

                        var newCancel = new CancelOrder();
                        newCancel.product.push(found.product);
                        newCancel.prices.push(found.prices);
                        newCancel.qty.push(found.qty);
                        newCancel.total = found.total;
                        newCancel.user = found.user;
                        newCancel.reason = req.body.reason;


                        newCancel.save((err,saved)=>{
                        if(err){

                            res.json({
                                cancel: false
                            });
                        } else if (saved){
                            res.json({
                                cancel: true
                            });
                        }
                    });


                    }
                });
            }
        });
    }
});
*/
// GETTING MY CURRENT ORDERS
app.get('/api/getmypendingordernumber', (req,res)=>{
    var headerexists = req.headers.authorization;

    if(!headerexists){
        res.json({
            updated: false
        });
    } else if (headerexists){
        var token = headerexists.split(' ')[1];

        jwt.verify(token, secretkey, (err,suc)=>{
            if(err){
                res.json({
                    updated:false
                });
            } else if (suc){
                var ID = suc.id;

                
                Order.count({user:ID},(err,found)=>{

                    if(err){
                        res.json({
                            finding: false
                        });
                    } else if (found){
                        console.log('coutings',found);
                    res.json({
                        finding: true,
                        number: found
                    });

                    }
                });
            }
        });
    }


});

// GETTING THE CONFIRMED ORDER HISTORY
app.get('/api/orderhistory', (req,res)=>{

    var headerexists = req.headers.authorization;

    if(!headerexists){
       
        res.json({
            got:false
        });
    } else {
        var token = headerexists.split(' ')[1];

        jwt.verify(token, secretkey, (err,suc)=>{
            if(err){
              

                res.json({
                    got:false
                })
            } else if (suc){
                var ID = suc.id;

 DelOrder.find({user:ID}, (err,found)=>{
     if(err){
        

         res.json({
             got:false
         })
     } else if (found){

         res.json({
             got:true,
             finding:found
         })
     }
 }) 

            }
        })
    }
});


//  GET THE PROMOTIONS
app.get('/api/getPromotions', (req,res)=>{

    Promotion.find({}, (err,found)=>{
        if(err){
            res.json({
                finding: false
            })
        } else if (found) {

          
            res.json({

            finding: true,
            promotions:found
            })
        }
    })
});

// GET THE HAMPERS
app.get('/api/gettinghampers', (req,res)=>{
    var headerexists =  req.headers.authorization;

    if(!headerexists){
        res.json({
            finding: false
        })
    } else if (headerexists) {
        var token = headerexists.split(' ')[1];

        jwt.verify(token, secretkey, (err,suc)=>{
            if(err){
                res.json({
                    finding : false
                })
            } else if (suc){
                Hams.find({},(err,found)=>{
                    if(err){
                        res.json({
                            finding: false
                        })
                    } else if (found) {
                        res.json({
                            finding: true,
                            data:found
                        })
                    }
                });
            }
        });
    }
});

//APP LISTENING TO PORT
app.listen(port,function(){
	console.log('app listening on port' + port);
});