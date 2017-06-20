// stolen from twitter:typeahead.js examples
// src: http://twitter.github.io/typeahead.js/examples/

// string matcher that suggests "agender" for "age"
// and otherwise selects which values to present
// as suggestions
var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex

    // an array that will be populated with substring matches
    matches = []

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i')

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str)
      }
    })

    // return matches to the caller
    cb(matches)
  }
}

// ya ok let's init n do this
$(function () {
  // retrieve initial list of genders
  $.get('genders.txt').then(function (res) {
    var genders = res.split(/\n/ig)
    // instantiate, populate typeahead
    $('.gender .typeahead').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    }, {
      name: 'genders',
      source: substringMatcher(genders)
    })
  })

  // capture form submission
  // to flash gender-approved message
  $('form.gender').on('submit', function (e) {
    e.preventDefault()
    $('.gender-approved').show()
    setTimeout(function () {
      $('.gender-approved').hide()
    }, 5000)
  })
})
