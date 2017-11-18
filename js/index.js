(() => {
	let dateFormatter = new Intl.DateTimeFormat([], { year: "numeric", month: "long", day: "numeric" })

	let domLoaded = function() {
		if (localStorage.accessToken) {
			document.querySelector("#logged-in-user").innerText = localStorage.authorName
			document.documentElement.classList.add("logged-in")
		}

		return fetch("infrastructure/posts.json")
		.then((response) => response.json())
		.then((posts) => {
			posts
			.sort((a, b) => { return a.timestamp < b.timestamp })
			.map((post) => {
				let postElement = document.querySelector("#post-template").content

				postElement.querySelector(".post").href = `post.html?id=${post.id}`
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
