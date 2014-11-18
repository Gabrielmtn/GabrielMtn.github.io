$(document).ready(function() {
  
$("nav.navbar").velocity({rotateX:["0" , "-64"], scale:[ "1" , "0.96"],opacity:[ "1" , "0"] }, { duration: 900, easing : "linear"  }); 
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 550, delay: 0, easing : "linear"  });
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 900, delay: 550, easing : "linear"  });


$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 550, delay: 0, easing : "linear"  });
$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 950, delay: 550, easing : "linear"  });

$(".btn-xl").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 750, delay: 0, easing : "linear"  });
$(".btn-xl").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 950, delay: 750, easing : "linear"  });
});
