$(document).ready(function() {
  
$("nav.navbar").velocity({rotateX:["0" , "-65deg"],rotateY:["0" , "-0.2"], scale:[ "1" , "0.97"],opacity:[ "1" , "0.60"] }, { duration: 650, easing : "easeInOutCirc"  }); 

// $("div.intro-lead-in").velocity({color:"#ffffff" }, { duration: 10, delay: 0, easing : "linear"  });
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"],color:"#eee", scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 480, delay: 0, easing : "linear"  });
$("div.intro-lead-in").velocity({rotateX:["0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 800, delay: 500, easing : "linear"  });


// $("div.intro-heading").velocity({color:"#ffffff" }, { duration: 10, delay: 0, easing : "linear"  });
$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], color:"#eee", scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 480, delay: 0, easing : "linear"  });
$("div.intro-heading").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 800, delay: 500, easing : "linear"  });







$(".btn-xl").velocity({rotateX:[ "0" , "-14"], backgroundColor: "#fed136",borderColor: "#fed136",color: "#eee",opacity:[ "0" , "0"] }, { duration: 750, delay: 0, easing : "linear"  });
$(".btn-xl").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 950, delay: 700, easing : "linear"  });


$("#habla_window_state_div").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "0" , "0"] }, { duration: 1550, delay: 0, easing : "linear"  });
$("#habla_window_state_div").velocity({rotateX:[ "0" , "-14"], scale:[ "1" , "0.99"],opacity:[ "1" , "0"] }, { duration: 2950, delay: 1550, easing : "linear"  });


$("#font-bomb").on('click', function(event) {

  
  $(this).html("Go back up, and click the text to blow the characters up!").velocity({
    translateY:"6",
    translateX:"",
    padding:"10px",
    paddingTop:"10px",
    margin:"20px",
    scale: "1.1",
    opacity: "1.2",
  }, 800).velocity("reverse", 450, "easeOut");
  /* Act on the event */ 
  $("#made-with-love").velocity({
    
    translateY:"-55",
    padding:"20px",
    paddingTop:"40px",
    margin:"20px",
  }, 100).velocity("reverse", 450, "easeOutBounce");
  /* Act on the event */
});

$(".icons").mousedown(function(){
  $(this).velocity({
    // rotateX: "26deg",
    scale:'0.77',
    rotateY:"4deg",
     
  }, 150, "easeOut").velocity({
    // rotateX: "0deg",
    rotateY:"0deg",
    scale:"1",        
    boxShadowBlur:"0",        
    boxShadowSpread:"0%",

  }, 200).velocity({
    
    rotateY:"0deg",
    rotateY:"0deg",
    // scale:"1",


    
  }, 225, "easeOutBounce").velocity("reverse", 250, "easeOutBounce");


});

$("#big-heart").mousedown(function(){
  $(this).velocity({
    scale:'1.19',
    rotateY:"200deg",
     
  }, 350, "easeOutBounce").velocity({
    rotateY:"0deg",
    scale:"1",        
    boxShadowBlur:"0",        
    boxShadowSpread:"0%",

  }, 375).velocity({    
    rotateY:"0deg",
    // scale:"1",


    
  }, 300, "easeOutBounce").velocity("reverse", 150, "easeOutBounce");


});


});
