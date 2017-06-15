const concatenate_bufs = function(...bufs) {
	let result = new Uint8Array(bufs.reduce((acc, el) => acc + el.byteLength, 0))

	bufs.reduce((acc, el) => {
		result.set(el, acc)
		return acc + el.byteLength
	}, 0)

	return result
}

const b64_encode_buf = (buf) => btoa(String.fromCharCode.apply(null, buf))

const b64_decode_str = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0))

// Usage: encrypt_access_token("mytoken", "mypassword")
const encrypt_access_token = function(token, password) {
	const salt = window.crypto.getRandomValues(new Uint8Array(32))
	const vector = window.crypto.getRandomValues(new Uint8Array(16))
	let key

	const salted_pass = concatenate_bufs(new TextEncoder("utf-8").encode(password), salt)

	return window.crypto.subtle.digest({ name: "SHA-256" }, salted_pass)
		.then((hash) => {
			return window.crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["encrypt", "decrypt"])
		})
		.then((importedKey) => {
			key = importedKey
			return window.crypto.subtle.encrypt({ name: "AES-CBC", iv: vector }, key, new TextEncoder("utf-8").encode(token))
		})
		.then((encrypted_token) => {
			return b64_encode_buf(concatenate_bufs(salt, vector, new Uint8Array(encrypted_token)))
		})
}

// Usage: decrypt_access_token("aldskjwlf", "mypassword")
const decrypt_access_token = function(token, password) {
	const decoded = b64_decode_str(token)
	const salt = decoded.subarray(0, 32)
	const vector = decoded.subarray(32, 48)
	const encrypted_token = decoded.subarray(48)

	const salted_pass = concatenate_bufs(new TextEncoder("utf-8").encode(password), salt)

	return window.crypto.subtle.digest({ name: "SHA-256" }, salted_pass)
		.then((hash) => {
			return window.crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["encrypt", "decrypt"])
		})
		.then((key) => {
			return window.crypto.subtle.decrypt({ name: "AES-CBC", iv: vector }, key, encrypted_token)
		})
		.then((decrypted_token) => {
			return new TextDecoder("utf-8").decode(new Uint8Array(decrypted_token))
		})
}

const try_decrypt_token = function() {
	let password = document.querySelector("#password").value
	let result_field = document.querySelector("#result")

	return fetch("tokens/bmwalters.b64")
		.then((res) => res.text())
		.then((contents) => {
			return decrypt_access_token(contents, password)
		})
		.then((token) => {
			result_field.style.color = "green"
			result_field.innerText = token
		})
		.catch((err) => {
			result_field.style.color = "red"
			result_field.innerText = "bad password"
		})
}

const github_client_id = "73cc67a71dcb0ed49a8e"

const fetch_github_secret = function(access_token) {
	let options = {
		headers: new Headers({
			Authorization: "Basic " + btoa("embloggenbot:" + access_token)
		})
	}

	return fetch("https://api.github.com/user/emails", options)
		.then((response) => response.json())
		.then((data) => {
			let addr = data.find((el) => el.email.includes("sec.ret")).email
			return addr.substring(0, addr.indexOf("@"))
		})
}
