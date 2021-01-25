module.exports = http => {
    const io = require('socket.io')(http)

    io.on('connection', socket => {
        console.log('wow a user connected')

        io.emit('test', 'test')
    })
}