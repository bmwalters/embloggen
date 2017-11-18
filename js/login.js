const concatenateBufs = function(...bufs) {
	let result = new Uint8Array(bufs.reduce((acc, el) => acc + el.byteLength, 0))

	bufs.reduce((acc, el) => {
		result.set(el, acc)
		return acc + el.byteLength
	}, 0)

	return result
}

const b64_encode_buf = (buf) => btoa(String.fromCharCode.apply(null, buf))

const b64_decode_str = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

// Usage: encryptAccessToken("mytoken", "mypassword")
const encryptAccessToken = function(token, password) {
	const salt = window.crypto.getRandomValues(new Uint8Array(32))
	const vector = window.crypto.getRandomValues(new Uint8Array(16))
	let key

	const saltedPass = concatenateBufs(new TextEncoder("utf-8").encode(password), salt)

	return window.crypto.subtle.digest({ name: "SHA-256" }, saltedPass)
		.then((hash) => {
			return window.crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["encrypt", "decrypt"])
		})
		.then((importedKey) => {
			key = importedKey
			return window.crypto.subtle.encrypt({ name: "AES-CBC", iv: vector }, key, new TextEncoder("utf-8").encode(token))
		})
		.then((encryptedToken) => {
			return b64_encode_buf(concatenateBufs(salt, vector, new Uint8Array(encryptedToken)))
		})
}

// Usage: decryptAccessToken("aldskjwlf", "mypassword")
const decryptAccessToken = function(token, password) {
	const decoded = b64_decode_str(token)
	const salt = decoded.subarray(0, 32)
	const vector = decoded.subarray(32, 48)
	const encryptedToken = decoded.subarray(48)

	const saltedPass = concatenateBufs(new TextEncoder("utf-8").encode(password), salt)

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

const try_decrypt_token = function() {
	let password = document.querySelector("#password").value
	let resultField = document.querySelector("#result")

	return fetch("infrastructure/tokens/bmwalters.b64")
		.then((res) => res.text())
		.then((contents) => {
			return decryptAccessToken(contents, password)
		})
		.then((token) => {
			resultField.style.color = "green"
			resultField.innerText = token
		})
		.catch((err) => {
			resultField.style.color = "red"
			resultField.innerText = "bad password"
		})
}

const gitHubClientId = "73cc67a71dcb0ed49a8e"

const fetchGitHubSecret = function(accessToken) {
	let options = {
		headers: new Headers({
			Authorization: "Basic " + btoa("embloggenbot:" + accessToken)
		})
	}

	return fetch("https://api.github.com/user/emails", options)
		.then((response) => response.json())
		.then((data) => {
			let addr = data.find((el) => el.email.includes("sec.ret")).email
			return addr.substring(0, addr.indexOf("@"))
		})
}
