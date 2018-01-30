var keystone = require("keystone");
var async = require("async");

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = "home";
	locals.data = {
		categories: []
	};

	// Load all categories
	view.on("init", function(next) {
		keystone
			.list("PostCategory")
			.model.find()
			.sort("name")
			.exec(function(err, results) {
				if (err || !results.length) {
					return next(err);
				}

				locals.data.categories = results;

				// Load the counts for each category
				async.each(
					locals.data.categories,
					function(category, next) {
						keystone
							.list("Post")
							.model.count()
							.where("categories")
							.in([category.id])
							.exec(function(err, count) {
								category.postCount = count;
								next(err);
							});
					},
					function(err) {
						next(err);
					}
				);
			});
	});

	// Render the view
	view.render("index");
};
