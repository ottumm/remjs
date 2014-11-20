var applyModifiers = require('../modifiers')

module.exports = {
	path: '/:id',
	method: 'get',
	middleware: require('../middleware/save-id'),
	handler: function(resource, req, res) {
		var query = resource.options.buildQuery(req);
		query[resource.options.id_key] = req.params.id;

		var opts = {
			query: query
		}

		opts = applyModifiers( opts, req );

		var cursor = resource.db.find(opts.query, opts.projection );
		cursor = opts.before(cursor);
		cursor.exec( function (err, docs) {
			if ( err )
				return res.status(500).send("An unexpected error occurred.");
			else if ( !docs || docs.length == 0 )
				return res.status(404).send("Resource not found.");
			else if ( docs.length != 1 )
				return res.status(500).send("This should never happen.");
			
			docs = opts.after( docs );
			res.status(200).send(docs[0]);
		});
	}
}