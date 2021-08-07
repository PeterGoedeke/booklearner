let fileToSubmit = null
console.log(window.location.hostname + window.location.port)

const baseUrl = `${window.location.hostname}:${window.location.port}`

async function uploadFile(file) {
    const response = await fetch(`${baseUrl}/requests`, {
        method: 'POST',
        body: file
    })
    const data = await response.json()
    console.log(data)    
}

function dropHandler(ev) {
    console.log('File(s) dropped')

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault()

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                const file = ev.dataTransfer.items[i].getAsFile()
                console.log('... file[' + i + '].name = ' + file.name)
                const form = new FormData()
                form.append('file', file)
                uploadFile(form)
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            const file = ev.dataTransfer.files[i]
            console.log('... file[' + i + '].name = ' + file.name)
            const form = new FormData()
            form.append('file', file)
            uploadFile(form)
        }
    }
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone')

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault()
}