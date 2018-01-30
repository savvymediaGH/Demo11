var keystone = require("keystone");
var async = require("async");

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.filters = {
		keywords: req.query.keywords
	};
	locals.data = {
		posts: [],
		categories: [],
		keywords: "",
		invalid: ""
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

				next(err);

				// Load the counts for each category
				// async.each(locals.data.categories, function (category, next) {
				//
				// 	keystone.list('Post').model.count().where('categories').in([category.id]).exec(function (err, count) {
				// 		category.postCount = count;
				// 		next(err);
				// 	});
				//
				// }, function (err) {
				// 	next(err);
				// });
			});
	});

	// Load the current product
	view.on("init", function(next) {
		//console.log("search keywords=" + locals.filters.keywords);
		if (!locals.filters.keywords) {
			locals.data.invalid = "Invalid search";
			next();
		} else {
			locals.data.keywords = locals.filters.keywords;

			// search the full-text index
			var q = keystone
				.list("Post")
				.paginate({
					page: req.query.page || 1,
					perPage: 10,
					maxPages: 10,
					filters: {
						state: "published"
					}
				})
				.sort("-publishedDate")
				.populate("author categories")
				.model.find(
					{
						// title: new RegExp("^" + locals.data.keywords + "$", "i")
						title: new RegExp(locals.data.keywords, "i"),
						state: "published"
					},
					function(err, res) {
						// Do your action here..
						// locals.data.posts = res;

						//console.log(res);
						if (res == "") {
							locals.data.invalid = "Invalid search";
						}
						//next(err);
					}
				);

			q.exec(function(err, results) {
				locals.data.posts = results;
				next(err);
			});
		}
	});

	view.render("search");
};
