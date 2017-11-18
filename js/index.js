(() => {
	let fetchPosts = function() {
		return Promise.resolve([
		{
			title: "Uh oh!",
			synopsis: "Exploration has turned to exploitation, and our young fellow now seeks to control his host habitat.",
			author: "bmwalters",
			timestamp: new Date(1511074800000)
		},
		{
			title: "Back for More",
			synopsis: "The aforementioned fellow has become enthralled with the new world, and has begun to eagerly explore it.",
			author: "bmwalters",
			timestamp: new Date(1509429600000)
		},
		{
			title: "Hello World",
			synopsis: "A brave young fellow enters the world of the GitHub API for the first time.",
			author: "bmwalters",
			timestamp: new Date(1497420000000)
		},
		])
	}

	let dateFormatter = new Intl.DateTimeFormat([], { year: "numeric", month: "long", day: "numeric" })

	let domLoaded = function() {
		if (localStorage.accessToken) {
			document.querySelector("#logged-in-user").innerText = localStorage.authorName
			document.documentElement.classList.add("logged-in")
		}

		fetchPosts()
		.then((posts) => {
			posts
			.sort((a, b) => { return a.timestamp < b.timestamp })
			.map((post) => {
				let postElement = document.querySelector("#post-template").content

				postElement.querySelector(".post-title").innerText = post.title
				postElement.querySelector(".post-synopsis").innerText = post.synopsis
				postElement.querySelector(".post-author").innerText = post.author
				postElement.querySelector(".post-date").innerText = dateFormatter.format(post.timestamp)

				return document.importNode(postElement, true)
			})
			.forEach((postElement) => {
				document.querySelector("#post-list").appendChild(postElement)
			})
		})
	}

	if (document.readyState !== "loading") {
		domLoaded()
	} else {
		document.addEventListener("DOMContentLoaded", domLoaded)
	}
})()
