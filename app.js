require('dotenv').config();

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
	flash       = require("connect-flash"),
    methodOverride = require("method-override");


var Question = require("./models/question");

mongoose.connect(`mongodb+srv://webapp:${process.env.MONGODB_PASSWORD}@cluster0-6wzcn.mongodb.net/kbc?retryWrites=true&w=majority`,{
	useNewUrlParser:true,
	useUnifiedTopology:true,
	useCreateIndex: true
}).then(()=> {
	console.log("Connected to DB");
}).catch(err => {
	console.log("Error",err.message);
});

mongoose.set('useCreateIndex', true);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static(__dirname+'/public'));
app.use(methodOverride("_method"));
app.use(flash());

app.get('/',function(req,res){
	res.render("entry")
})
app.get('/rules',function(req,res){
	res.render("rules")
})
app.get('/play',function(req,res){
	res.render("questionpage")
})
app.get('/end-game',function(req,res){
	res.render("endgame.ejs");
})

app.get('/get-questions',async function(req,res){
	
	let questions=[];

	Question.findRandom({difficulty: 'easy'},{question: 1, difficulty: 1, options: 1, correctOption: 1, image: 1},{limit: 6},function(err,easyQues){
		if(err){
			console.log(err);
			return res.status(500).send({error: err.message});
		}
		questions = [...easyQues];
		Question.findRandom({difficulty: 'medium'},{question: 1, difficulty: 1, options: 1, correctOption: 1, image: 1},{limit: 8},function(err,medQues){
			if(err){
				console.log(err);
				return res.status(500).send({error: err.message});
			}
			questions = [...questions,...medQues];
			Question.findRandom({difficulty: 'hard'},{question: 1, difficulty: 1, options: 1, correctOption: 1, image: 1},{limit: 2},function(err,hardQues){
				if(err){
					console.log(err);
					return res.status(500).send({error: err.message});
				}
				questions = [...questions,...hardQues];
				res.send(questions);
			});
		});
	});
	
})

app.get('/flipQuestion',function(req,res){
	Question.findOneRandom(function(err, ques) {
		if (!err) {
			return res.send(ques);
		}
		res.status(500).send(err.message);
	});
})

// app.get('/add-question',function(req,res){
// 	res.render("addQues");
// });
// app.post('/add-question',async function(req,res){
// 	try{
// 		const newQues = new Question({
// 			question: req.body.question,
// 			image: req.body.image || '',
// 			options: req.body.options.split(',,'),
// 			difficulty: req.body.difficulty,
// 			correctOption: req.body.correctOption
// 		})
// 		await newQues.save();
// 		res.send({message: 'Your Question has been added Successfully!'});
// 	} catch(err){
// 		res.status(500).send({error: err.message});
// 	}
// })

                                                                
var request = require('request');

app.post('/sendMessage',function(req,res){
	const mobileNum = req.body.mobileNum;
	const question = req.body.question;
	const image = req.body.image?'Image: '+req.body.image:' ';
	const choices = req.body.choices;
	var options = {
	  'method': 'POST',
	  'url': 'https://rest-api.d7networks.com/secure/send',
	  'headers': {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': process.env.SEND_SMS_AUTH_TOKEN
	  },
	  body: `{\n\t\"to\":\"${mobileNum}\",\n\t\"content\":\"Hello from KBC Quiz, your friend sends u a question: ${question} ${image} And Choices are: ${choices} \", \n\t\"from\":\"SMSINFO\",\n\t\"dlr\":\"yes\",\n\t\"dlr-method\":\"GET\", \n\t\"dlr-level\":\"2\", \n\t\"dlr-url\":\"http://yourcustompostbackurl.com\"\n}`

	};

	request(options, function (error, response) {
	    if (error){
			return res.status(500).send({error: error.message});
		}
		console.log(response.body);
		res.status(200).send({message: 'message has send successfully!'});
	});
	
})


app.get("*",function(req,res){
	res.render("404");
});

app.listen(process.env.PORT || 3000, process.env.IP, function(){
   console.log("Server has started");
});
