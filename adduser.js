#!/usr/bin/env node
const Database = require('@replit/database')
const db = new Database()

const bcrypt = require('bcrypt')

const readline = require('readline')

const io = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
})

io.question('Username: ', async (username) => {
	if(await db.get(username)) {
		console.log(`the user ${username} already exists`)
		return io.close()
	}
	io.question('Password: ', (password) => {
		io.question('IP Address: ', async (ip) => {
			const user_data = {
				'username': username,
				'hash': await bcrypt.hash(password, 10),
				'ip': ip,
			}
			await db.set(username, user_data)
			console.log(`user ${username} added`)
			io.close()
		})
	})
})
