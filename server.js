/**
 * ui-bot
 * An IRC bot for irc.freenode.net/angularjs
 * @license MIT
*/

// requires node's http module
var http = require('http'),
	jerk = require('jerk');
	mongoose = require('mongoose');
	
var options = {
	server: 'irc.freenode.net',
	nick: 'uiBot',
	log: false,
	channels: [ '#angularjs' ],
	flood_protection: true,
	user: {
		username: 'uiBot',
		realname: 'AngularUI Bot'
	}
};

// Setup Mongo
mongoose.connect("mongodb://nodejitsu:7204332011a4696febdf436086f308b5@alex.mongohq.com:10090/nodejitsudb669047986308");
var Schema = mongoose.Schema;
var Command = new Schema({
	key: String,
	value: String
});
var command = mongoose.model('Command', Command);

jerk( function( j ) {
	// Cache of active commands
	var list = {};
	
	// Load all commands from Mongo
	command.find({}, function(err, commands) {
		var length = commands.length;
		commands.forEach(function(cmd){
			list[cmd.key] = cmd.value;
		});
	});
	
	// List all active commands
	j.watch_for( '!list', function ( message ) {
		message.say( 'Existing Commands: ' + Object.keys(list).join(', ') );
	});
	
	// ![nonSpace] [optional arg] [@optionalNick @anotherNick]
	j.watch_for( /^!(\S+)( ([-\s\+\w]+))?(( @\S+)*)$/i , function ( message ) {
		var msg = list[message.match_data[1]];
		if (msg) {
			var user = message.user;
			// cutoff @ if @target is passed
			if (message.match_data[4])
				user = message.match_data[4].substr(1).split('@').join('');
			var arg = message.match_data[3] || '';
			// convert spaces in arg to + character
			if (arg) {
				arg = arg.split(' ').join('+');
			}
			message.say( msg.split(':nick').join(user).split(':arg').join(arg) );
		}
	});
	
	// !remember [nonSpace] id [value containing optional :nick and :arg]
	j.watch_for( /^!remember (\S+) is (.+)/i, function ( message ) {
		var cmd = new command({ key: message.match_data[1], value: message.match_data[2] });
		if (list[cmd.key]) {
			message.say( message.user + ': "'+cmd.key+'" already exists');
			return;
		}
		cmd.save(function(err) {
			list[cmd.key] = cmd.value;
			message.say( message.user + ': "' + cmd.key + '" has been saved' );
		});
	});
	
	// !forget [nonSpace]
	j.watch_for( /^!forget (\S+)/i, function ( message ) {
		var key = message.match_data[1];
		command.remove({ key: key }, function(err) {
			delete list[key];
			message.say( 'The "'+key+'" command has been removed' );
		});
	});
	
	// !show [nonSpace]
	j.watch_for( /^!show (\S+)/i, function ( message ) {
		var key = message.match_data[1];
		message.say( key+' is "'+list[key]+'"' );
	});
}).connect(options);




// BELOW CODE IS JUST TO MAKE NODEJITSU HAPPY //

// creates a new httpServer instance
http.createServer(function (req, res) {
  // this is the callback, or request handler for the httpServer

  // respond to the browser, write some headers so the 
  // browser knows what type of content we are sending
  res.writeHead(200, {'Content-Type': 'text/html'});

  // write some content to the browser that your user will see
  res.write('<h1>hello, i know nodejitsu.</h1>');

  // close the response
  res.end();
}).listen(20129); // the server will listen on port 80
