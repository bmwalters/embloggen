(() => {
	let dateFormatter = new Intl.DateTimeFormat([], { year: "numeric", month: "long", day: "numeric" })

	let domLoaded = function() {
		const postId = (new URLSearchParams(window.location.search)).get("id")

		fetch("infrastructure/posts.json")
		.then((response) => response.json())
		.then((posts) => {
			const post = posts.find((post) => { return post.id == postId })

			document.querySelector("#post-title").innerText = post.title
			document.querySelector("#post-author").innerText = post.author
			document.querySelector("#post-date").innerText = dateFormatter.format(post.timestamp)

			return fetch(`infrastructure/posts/${post.content}`)
		})
		.then((response) => response.text())
		.then((postContent) => {
			document.querySelector("#post-content").innerText = postContent
		})
	}

	if (document.readyState !== "loading") {
		domLoaded()
	} else {
		document.addEventListener("DOMContentLoaded", domLoaded)
	}
})()
