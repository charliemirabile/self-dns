# self-dns

This is a repl hosting a node.js app I wrote to help me access a server that does not have a static IP address. I set up a cronjob on the server to have it phone home to this app and keep the app updated with its most recent public ip address using `curl`, and then I can access this app from wherever I want to query it for the last known public IP from my server so I can connect to it. In essence, I am bootstrapping something like DNS or a static IP for my server off of the unchanging url of this project on replit.

## security

This repl uses http basic authentication (username and password) to ensure only users who are authorized can view and change the ip address associated with a particular account. HTTPS provides an encrypted tunnel for sending authentication data to the server and passwords are hashed+salted and not stored in plaintext. The IP address associated with a particular user is stored in plaintext, but can only be accessed by someone who knows the correct password for a particular user or someone with admin access to the replit database for this repl. A more sophisticated scheme could be employed to avoid storing the IP addresses in the database in plaintext, but a threat actor who had backend access to the server could still collect the data over time by watching traffic or modifying the application, so I do not think the complexity is worth it for the upside of only preventing access to historical data.

## dependencies

This repl uses `express` for serving on http, `bcrypt` for hashing+salting passwords and the builtin replit database for storage.

## API

- All requests must be made to the root end-point `'/'` or the server will return `404 Not Found`.
- All requests must be made with either the HTTP `GET` or `DELETE` methods or the server will return `405 Method Not Allowed`.
- All requests must have http basic authentication credentials included or the server will return `401 Unauthorized`.
- All requests must have correct credentials for some extant account or the server will return `403 Forbidden`.
- HTTP `GET` will return `200 OK` and provide the last known IP address associated with the account for which credentials were provided.
- HTTP `DELETE` will return `200 OK` and provide the updated IP address associated with the account for which credentials were provided after deleting the old last known IP address associated with that account and replacing it with the public IP that made the request.
	- this is perhaps a bit of an abuse of the semantics of HTTP `DELETE`, but in my defense `DELETE` is the only non-safe HTTP method that does not require a request body. HTTP `PUT` might have been a better choice if I wanted to allow the user to provide the ip address they wanted to set in the request body, but since I can just get their IP from the request there is no need to introduce that complexity. My use of `DELETE` also does not violate the assumptions the HTTP standard lays out that `DELETE` requests should be idempotent and their responses should not be cached, so all things considered, I think it is acceptable.

- There is no way to automatically register a new user using the main web app (I have to add them manually using the adduser.js file in the replit console) but I think this is wise, as letting anyone register could quickly fill up the database or cause undue stress on this application.

## practical example

I created an account for my server on the repl in the console and kept a note of the selected username and password (they shall be referred to as `$USERNAME` and `$PASSWORD` henceforth).

I verified that I could access the repl in my browser at the URL replit provided (e.g. https://self-dns.charliemirabile.repl.co henceforth `$HOSTNAME`) and that it prompted me for my credentials and displayed the value I set for the initial IP address when creating the account after I entered `$USERNAME` and `$PASSWORD`.

On my server, I added an hourly cron job (`0 * * * *`) to run the `curl` command and request `$HOSTNAME` with the credentials supplied (`-u $USERNAME:$PASSWORD`) and the http `DELETE` method specified (`-X DELETE`).

In order to verify the cron job was working and keep logs for it, I redirected the `stderr` and `stdout` of my `curl` command to the `logger` command with an arbitrary but sensible (e.g. 'replit_dns' henceforth $TAG) value provided for the tag (`-t`) option to capture the command output in the system log.

Unfortunately `curl` likes to display a progress bar on stderr if stdout is redirected, so I had to add the 'silent' (`-s`) option, but also the 'show error' (`-S`) option to preserve the error message in case the repl was down.

The full line in my crontab was:

```crontab
0 * * * * curl -s -S -X DELETE -u $USERNAME:$PASSWORD $HOSTNAME 2>&1 | logger -t $TAG
```

where the variables were manually replaced with their appropriate values.

I can now view the logs using `journalctl -t $TAG` any time to verify the job is running and see a log of my public IP address over time or any errors `curl` encountered.

On any other system, I can visit `$HOSTNAME` in a web browser any time I want and enter `$USERNAME` and `$PASSWORD` to see the ip address on file for my server, or access it in the terminal using `curl -u $USERNAME:$PASSWORD $HOSTNAME`.
