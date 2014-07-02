[HTML5 Boilerplate homepage](http://html5boilerplate.com) | [Documentation
table of contents](TOC.md)

# Frequently asked questions

* [Why is the URL for jQuery without
  `http`?](#why-is-the-url-for-jquery-without-http)
* [Why don't you automatically load the latest version of jQuery from the Google
  CDN?](#why-dont-you-automatically-load-the-latest-version-of-jquery-from-the-google-cdn)
* [Why is the Google Analytics code at the bottom? Google recommends it be
  placed in the `<head>`.](#why-is-the-google-analytics-code-at-the-bottom-google-recommends-it-be-placed-in-the-head)
* [How can I integrate Bootstrap with HTML5
  Boilerplate?](#how-can-i-integrate-bootstrap-with-html5-boilerplate)
* [Do I need to upgrade my site each time a new version of HTML5 Boilerplate is
  released?](#do-i-need-to-upgrade-my-site-each-time-a-new-version-of-html5-boilerplate-is-released)
* [Where can I get help with support
  questions?](#where-can-i-get-help-with-support-questions)

--

### Why is the URL for jQuery without `http`?

It is because of the use of [protocol-relative
URLs](http://paulirish.com/2010/the-protocol-relative-url/).

**N.B.** If you try to view the local web page directly in the browser, the
browser will fail to load the assets specified using protocol-relative URLs as
it will attempt to fetch them from the local file system. We recommend you use
a local server to test your web pages, or a file hosting service that allows
you to preview your web pages online (e.g. [Dropbox](https://www.dropbox.com/)).

Setting up a local server can be done using:

* Python 2.x by running `python -m SimpleHTTPServer` from your local directory
* Python 3.x by running `python -m http.server` from your local directory
* Ruby by installing and running [asdf](https://rubygems.org/gems/asdf)
* [LAMP](http://en.wikipedia.org/wiki/LAMP_%28software_bundle%29),
  [MAMP](http://www.mamp.info/en/index.html),
  [WAMP](http://www.wampserver.com/en/), or
  [XAMPP](http://www.apachefriends.org/index.html)


### Why don't you automatically load the latest version of jQuery from the Google CDN?

* The latest version may not be compatible with the existing plugins/code on
  the site, plus, version updating should always be an intentional decision!
* The latest version has a very short cache time (`1 hour`) compare to the
  specific version (`1 year`), which means that users won't get the benefits
  of long-term caching.


### Why is the Google Analytics code at the bottom? Google recommends it be placed in the `<head>`.

The main advantage of placing it in the `<head>` is that you will track a
user's `pageview` even if he leaves the page before it has been fully loaded.
However, having the code at the bottom of the page [helps improve
performance](http://stevesouders.com/efws/inline-scripts-bottom.php).


### How can I integrate [Bootstrap](http://getbootstrap.com/) with HTML5 Boilerplate?

One simple way is to use [Initializr](http://initializr.com) and create a
custom build that includes both HTML5 Boilerplate and
[Bootstrap](http://getbootstrap.com/).

Read more about how [HTML5 Boilerplate and Bootstrap complement each
other](http://www.quora.com/Is-Bootstrap-a-complement-or-an-alternative-to-HTML5-Boilerplate-or-viceversa/answer/Nicolas-Gallagher).


### Do I need to upgrade my site each time a new version of HTML5 Boilerplate is released?

No, same as you don't normally replace the foundation of a house once it
was built. However, there is nothing stopping you from trying to work in the
latest changes, but you'll have to assess the costs/benefits of doing so.


### Where can I get help with support questions?

Please ask for help on
[StackOverflow](http://stackoverflow.com/questions/tagged/html5boilerplate).
