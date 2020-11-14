var mongoose = require("mongoose");
var random = require("mongoose-simple-random");

var quesSchema = new mongoose.Schema({
	question: { type: String, required: true },
	difficulty: { type: String, default: 'easy'},
	options: { type: Array, default: [] },
	image: String,
	correctOption: {type: Number, required: true}

});

quesSchema.plugin(random);

module.exports = mongoose.model("Question", quesSchema);