(() => {
	const titleToIdentifier = (title) => title.replace(/[^\w]+/g, "-").slice(0, 20).toLowerCase()

	const createPost = function(title, synopsis, content) {
		const post = {
			id: titleToIdentifier(title),
			title: title,
			synopsis: synopsis,
			content: content,
			author: localStorage.authorName,
			timestamp: (new Date()).getTime()
		}

		const params = {
			message: `Create "${title}"`,
			author: {
				name: localStorage.commitName,
				email: localStorage.commitEmail
			},
			content: btoa(JSON.stringify(post))
		}

		const filePath = `infrastructure/posts/${post.id}.json`

		const options = {
			headers: new Headers({
				Authorization: `Basic ${btoa(`embloggenbot:${localStorage.accessToken}`)}`,
				Accept: "application/json",
				"Content-Type": "application/json"
			}),
			method: "PUT",
			body: JSON.stringify(params)
		}

		const apiBaseURL = "https://api.github.com"
		return fetch(`${apiBaseURL}/repos/bmwalters/embloggen/contents/${filePath}`, options)
	}

	const domLoaded = function() {
		document.querySelector("#new-post-form").addEventListener("submit", (e) => {
			e.preventDefault()

			let data = new FormData(e.target)

			// TODO: more validation

			createPost(data.get("title"), data.get("synopsis"), data.get("content"))
			.then(() => {
				window.location.href = "/"
			})
			.catch((err) => {
				console.log("error", err) // TODO: display error to user
			})
		})
	}

	if (document.readyState !== "loading") {
		domLoaded()
	} else {
		document.addEventListener("DOMContentLoaded", domLoaded)
	}
})()
