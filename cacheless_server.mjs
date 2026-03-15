import express from 'express'

const app = express()
const port = 8080

/* 
This is a primitive static server extracted from server.mjs.
It provides immediate cache expiration to ensure fresh content, 
especially useful for mobile testing where browser cache can get stuck.

visit it from mobile: [ip address]:8080
how to get ip address:
    "ipconfig" in powershell
    Look for "IPv4 Address" in the section "Wireless LAN adapter Wi-Fi"
other ports won't work (8080 is made available by "port forwarding" btw windows and wsl)
comp and mobile must be connected to same wifi
after both connect to a new wifi, ip needs to be changed

*** Port forwarding might be no longer necessary after providing this bunch of 0s as the second argument to app.listen. 
*/

app.use((req, res, next) => {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, max-age=0',
    )
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next()
})

app.use(express.static(process.cwd()))

app.listen(port, '0.0.0.0', () => {
    console.log(`Primitive cacheless server serving on http://localhost:${port}`)
})