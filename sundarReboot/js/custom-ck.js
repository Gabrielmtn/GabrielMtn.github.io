$(document).ready(function(){$("#type").change(function(e){e.preventDefault();type.value==="designer"?$("#mc-embedded-subscribe-form").attr("action","http://sundar.us3.list-manage.com/subscribe/post?u=aa3c7ea557f2f7d7d0e073ee3&amp;id=b40988313d"):type.value==="supplier"?$("#mc-embedded-subscribe-form").attr("action","http://sundar.us3.list-manage.com/subscribe/post?u=aa3c7ea557f2f7d7d0e073ee3&amp;id=ce3e25b20d"):$("#mc-embedded-subscribe-form").attr("action","")})});

$(document).ready(function() {
 
  $("#owl-demo").owlCarousel({
 
      navigation : true, // Show next and prev buttons
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true
 
      // "singleItem:true" is a shortcut for:
      // items : 1, 
      // itemsDesktop : false,
      // itemsDesktopSmall : false,
      // itemsTablet: false,
      // itemsMobile : false
 
  });
 
});