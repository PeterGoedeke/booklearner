disableDuplicates()

Array.from(document.querySelectorAll('select')).forEach(select => {
    select.addEventListener('change', disableDuplicates)
})

document.querySelector('form').onsubmit = function() {
    Array.from(document.querySelectorAll('select')).forEach(select => {
        Array.from(select.options).forEach(option => option.disabled = false)
    })
}

function disableDuplicates() {
    const selects = Array.from(document.querySelectorAll('select'))
    selects.forEach(select => 
        Array.from(select.options).forEach(option => option.disabled = false)
    )
    const inds = new Set(selects.map(s => s.selectedIndex))

    selects.forEach(select => 
        Array.from(select.options).forEach((option, i) => {
            if (inds.has(i)) {
                option.disabled = true
            }
        })
    )
}