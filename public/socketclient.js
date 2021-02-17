const socket = io()

const form = document.querySelector('form')
form.addEventListener('submit', function(event) {
    event.preventDefault()
    const identifier = document.createElement('input')
    identifier.value = socket.id
    identifier.type = 'hidden'
    identifier.name = 'socketid'
    form.appendChild(identifier)

    const url = 'http://localhost:3000/submit'
    const request = new XMLHttpRequest()
    request.open('POST', url, true)
    request.onload = function() { // request successful
    // we can use server response to our request now
    
        try {
            const response = JSON.parse(request.responseText)
            console.log(response)
        }
        catch (e) {
            document.open();
            document.write(request.responseText);
        }
    }

    request.onerror = function() {
        // request failed
    }

    request.send(new FormData(event.target)) // create FormData from form that triggered event
    // event.preventDefault()

    return true
})

function download(filename, text) {
    var element = document.createElement('a')
    element.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)
  
    element.style.display = 'none'
    document.body.appendChild(element)
  
    element.click()
  
    document.body.removeChild(element)
  }

socket.on('connect', () => {
    console.log(socket.id)
})

socket.on('words', data => {
    download('vocabulary.csv', data)
    console.log(data)
})

const queueIndex = document.querySelector('.queue_index')
const container = document.querySelector('.queue')
socket.on('queue', index => {
    container.display = 'block'
    queueIndex.textContent = index
})

socket.on('disconnect', () => {
    socket.removeAllListeners()
})