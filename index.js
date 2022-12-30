const express = require('express')
const app = express()

const bcrypt = require('bcrypt')

const Database = require('@replit/database')
const db = new Database()

const parse_auth_data = (auth_hdr) => {
	if(!auth_hdr)
		return null
	const auth_start = 'Basic '
	if(auth_hdr.substring(0, auth_start.length) !== auth_start)
		return null
	const auth_b64 = auth_hdr.substring(auth_start.length)
	const auth_str = Buffer.from(auth_b64, 'base64').toString()
	if(!auth_str)
		return null
	const colon_idx = auth_str.indexOf(':')
	if(colon_idx === -1)
		return null
	return {
		username: auth_str.substring(0, colon_idx),
		password: auth_str.substring(colon_idx + 1),
	}

}

const get_and_verify_user = async (auth_data) => {
	if(!auth_data)
		return null
	const {username, password} = auth_data
	if(!username || !password)
		return null
	const user_data = await db.get(username)
	if(!user_data)
		return null
	if (!await bcrypt.compare(password, user_data.hash))
		return null
	return user_data
}

const send_40X_or_logged_in = async (req, res, logged_in_callback) => {
	const auth_data = parse_auth_data(req.headers.authorization)
	if(!auth_data)
		return res.status(401).set('WWW-Authenticate', 'Basic').end('401 Unauthorized\n')
	const user_data = await get_and_verify_user(auth_data)
	if(!user_data)
		return res.status(403).end('403 Forbidden\n')
	return await logged_in_callback(req, res, user_data)
}

const send_200_ip = (req, res, ip) => {
	return res.status(200).end(`${ip}\n`)
}

const logged_in_get = (req, res, user_data) => {
	console.log(`GET for ${user_data.username}`)
	return send_200_ip(req, res, user_data.ip)
}

const logged_in_delete = async (req, res, user_data) => {
	console.log(`DELETE for ${user_data.username}`)
	if(req.ip !== user_data.ip) {
		user_data.ip = req.ip
		await db.set(user_data.username, user_data)
	}
	return send_200_ip(req, res, user_data.ip)
}

app.get('/', async (req, res) => {
	return await send_40X_or_logged_in(req, res, logged_in_get)
})

app.delete('/', async (req, res) => {
	return await send_40X_or_logged_in(req, res, logged_in_delete)
})

app.all('/', (req, res) => {
	return res.status(405).set('Allow', 'GET, DELETE').end('405 Method Not Allowed\n')
})

app.use((req, res) => {
	return res.status(404).end('404 Not Found\n')
})

app.set('trust proxy', true)
app.listen(3000, () => {
	console.log('app listening on port 3000')
})
