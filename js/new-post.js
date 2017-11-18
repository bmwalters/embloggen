(() => {
	const titleToIdentifier = (title) => title.replace(/[^\w]+/g, "-").slice(0, 20).toLowerCase()

	const createPost = function(title, synopsis, content) {
		const post = {
			id: titleToIdentifier(title),
			title: title,
			synopsis: synopsis,
			author: localStorage.authorName,
			timestamp: (new Date()).getTime()
		}

		post.content = `${post.id}.txt`

		const authorInfo = {
			name: localStorage.commitName,
			email: localStorage.commitEmail
		}

		const headers = new Headers({
			Authorization: `Basic ${btoa(`embloggenbot:${localStorage.accessToken}`)}`,
			Accept: "application/json",
			"Content-Type": "application/json"
		})

		const apiBaseURL = "https://api.github.com"

		const createContentFile = (() => {
			const params = {
				message: `Create "${title}"`,
				author: authorInfo,
				content: btoa(content)
			}

			const options = { headers: headers, body: JSON.stringify(params), method: "PUT" }
			const filePath = `infrastructure/posts/${post.content}`

			return fetch(`${apiBaseURL}/repos/bmwalters/embloggen/contents/${filePath}`, options)
		})()

		return createContentFile
		.then(() => {
			// update index
			return fetch(`${apiBaseURL}/repos/bmwalters/embloggen/contents/infrastructure/posts.json`, { headers: headers })
		})
		.then((response) => response.json())
		.then((posts) => {
			const postArray = JSON.parse(atob(posts.content))

			postArray.push(post)

			const params = {
				message: `Update post index for "${title}"`,
				author: authorInfo,
				content: btoa(JSON.stringify(postArray)),
				sha: posts.sha,
			}

			const options = { headers: headers, body: JSON.stringify(params), method: "PUT" }

			return fetch(`${apiBaseURL}/repos/bmwalters/embloggen/contents/infrastructure/posts.json`, options)
		})
	}

	const domLoaded = function() {
		document.querySelector("#new-post-form").addEventListener("submit", (e) => {
			e.preventDefault()

			let data = new FormData(e.target)

			// TODO: more validation

			createPost(data.get("title"), data.get("synopsis"), data.get("content"))
			.then(() => {
				window.location.href = "index.html"
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
