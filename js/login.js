(() => {
	const ErrorMessage = {
		invalidUsername: "ERROR_INVALID_USERNAME",
		invalidPassword: "ERROR_INVALID_PASSWORD",
	}

	const Base64 = {
		decode: (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
		encode: (buf) => btoa(String.fromCharCode.apply(null, buf))
	}

	const concatenateBuffers = function(...bufs) {
		let result = new Uint8Array(bufs.reduce((acc, el) => acc + el.byteLength, 0))

		bufs.reduce((acc, el) => {
			result.set(el, acc)
			return acc + el.byteLength
		}, 0)

		return result
	}

	// Usage: decryptAccessToken("aldskjwlf", "mypassword")
	const decryptAccessToken = function(token, password) {
		const decoded = Base64.decode(token)
		const salt = decoded.subarray(0, 32)
		const vector = decoded.subarray(32, 48)
		const encryptedToken = decoded.subarray(48)

		const saltedPass = concatenateBuffers(new TextEncoder("utf-8").encode(password), salt)

		return window.crypto.subtle.digest({ name: "SHA-256" }, saltedPass)
		.then((hash) => {
			return window.crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["encrypt", "decrypt"])
		})
		.then((key) => {
			return window.crypto.subtle.decrypt({ name: "AES-CBC", iv: vector }, key, encryptedToken)
		})
		.then((decryptedToken) => {
			return new TextDecoder("utf-8").decode(new Uint8Array(decryptedToken))
		})
	}

	// Usage: encryptAccessToken("mytoken", "mypassword")
	const encryptAccessToken = function(token, password) {
		const salt = window.crypto.getRandomValues(new Uint8Array(32))
		const vector = window.crypto.getRandomValues(new Uint8Array(16))
		let key

		const saltedPass = concatenateBuffers(new TextEncoder("utf-8").encode(password), salt)

		return window.crypto.subtle.digest({ name: "SHA-256" }, saltedPass)
			.then((hash) => {
				return window.crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["encrypt", "decrypt"])
			})
			.then((importedKey) => {
				key = importedKey
				return window.crypto.subtle.encrypt({ name: "AES-CBC", iv: vector }, key, new TextEncoder("utf-8").encode(token))
			})
			.then((encryptedToken) => {
				return Base64.encode(concatenateBuffers(salt, vector, new Uint8Array(encryptedToken)))
			})
	}

	let domLoaded = function() {
		document.querySelector("#login-form").addEventListener("submit", (e) => {
			e.preventDefault()

			let data = new FormData(e.target)
			let resultField = document.querySelector("#login-error")

			return fetch(`/infrastructure/tokens/${data.get("username")}.b64`)
			.then(function(response) {
				if (!response.ok) { throw new Error(ErrorMessage.invalidUsername) }
					return response
			})
			.then((res) => res.text())
			.then((contents) => {
				return decryptAccessToken(contents, data.get("password"))
				.catch(() => { throw new Error(ErrorMessage.invalidPassword) })
			})
			.then((token) => {
				localStorage.accessToken = token
				localStorage.authorName = data.get("username")
				window.location.href = "/"
			})
			.catch((err) => {
				if (err.message == ErrorMessage.invalidUsername) {
					resultField.innerText = "Username not registered."
				} else if (err.message == ErrorMessage.invalidPassword) {
					resultField.innerText = "Invalid password."
				} else {
					resultField.innerText = "Failed to log in. Please try again."
				}
			})
		})
	}

	if (document.readyState !== "loading") {
		domLoaded()
	} else {
		document.addEventListener("DOMContentLoaded", domLoaded)
	}
})()
