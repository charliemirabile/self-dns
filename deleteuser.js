#!/usr/bin/env node
const Database = require('@replit/database')
const db = new Database()

const readline = require('readline')

const io = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
})

io.question('Username: ', async (username) => {
	if(!await db.get(username)) {
		console.log(`the user ${username} doesn\'t exist`)
		return io.close()
	}
	await db.delete(username)
	console.log(`user ${username} deleted`)
	io.close()
})
